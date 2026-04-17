import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { Submission } from '@/lib/models/Submission';
import { Notification } from '@/lib/models/Notification';
import { successResponse, notFoundError, forbiddenError, validationError, serverError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

function isNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasObservationContent(observationData: any[]): boolean {
  if (!Array.isArray(observationData) || observationData.length === 0) {
    return false;
  }

  return observationData.some((table: any) =>
    Array.isArray(table?.rows) &&
    table.rows.some((row: any) =>
      row?.cells &&
      Object.values(row.cells).some((cellValue: any) => {
        if (typeof cellValue === 'string') {
          return cellValue.trim().length > 0;
        }
        return cellValue !== undefined && cellValue !== null && cellValue !== '';
      })
    )
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { id } = await params;
    const db = await getDatabase();
    const submission = await db
      .collection<Submission>('submissions')
      .findOne({ _id: new ObjectId(id) });

    if (!submission) {
      return notFoundError('Submission not found');
    }

    // Check permissions
    if (submission.studentId.toString() !== authResult.userId) {
      return forbiddenError('Access denied');
    }

    // Validate required fields on the server to prevent frontend bypass
    const errors: { [key: string]: string } = {};

    const template = await db
      .collection('experimentTemplates')
      .findOne({ _id: submission.experimentTemplateId });

    const templateSections = Array.isArray((template as any)?.sections) ? (template as any).sections : [];
    const hasSectionedTemplate = templateSections.length > 0;

    if (hasSectionedTemplate) {
      const editableSections = templateSections.filter(
        (section: any) =>
          section?.editable &&
          section?.type === 'text'
      );

      const missingSections: string[] = [];
      const sectionData = (submission as any).sectionData || {};
      const hasSectionDataEntries = Object.keys(sectionData).length > 0;

      // Backward compatibility: if sectioned template exists but no sectionData was
      // captured in this draft, validate using legacy content fields.
      if (!hasSectionDataEntries) {
        const hasObservations = hasObservationContent((submission as any).observationData || []);
        const hasResults = isNonEmptyString((submission as any).results);
        const hasConclusion = isNonEmptyString((submission as any).conclusion);

        if (!hasObservations && !hasResults && !hasConclusion) {
          errors.content = 'Please fill in at least observations, results, or conclusion before submitting';
        }
      } else {

        for (const section of editableSections) {
          const data = sectionData?.[section.id];
          const sectionLabel = section.title || section.content?.name || section.content?.problemTitle || section.type;

          if (!isNonEmptyString(data?.data)) {
            missingSections.push(sectionLabel || 'Text section');
          }
        }

        if (missingSections.length > 0) {
          errors.content = `Please complete all required text sections before submitting: ${missingSections.join(', ')}`;
        }
      }
    } else {
      // Fallback validation for legacy templates without sectioned editable blocks
      const hasObservations = hasObservationContent((submission as any).observationData || []);
      const hasResults = isNonEmptyString((submission as any).results);
      const hasConclusion = isNonEmptyString((submission as any).conclusion);

      if (!hasObservations || !hasResults || !hasConclusion) {
        errors.content = 'Please fill Observations, Result/Output, and Conclusion before submitting';
      }
    }

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    // Update submission status
    await db
      .collection<Submission>('submissions')
      .updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: 'submitted',
            submittedAt: new Date(),
            updatedAt: new Date(),
          },
          $unset: {
            rejectionReason: '',
            reviewComments: '',
            reviewedBy: '',
            reviewedAt: '',
          },
        }
      );

    // Get session to find faculty
    const session = await db
      .collection('labSessions')
      .findOne({ _id: submission.labSessionId });

    if (session) {
      // Create notification for faculty
      await db.collection<Notification>('notifications').insertOne({
        userId: session.conductedBy,
        type: 'pending_review',
        title: 'New Submission for Review',
        message: 'A student has submitted lab work for your review.',
        relatedEntityId: id,
        relatedEntityType: 'submission',
        read: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      });
    }

    const updatedSubmission = await db
      .collection<Submission>('submissions')
      .findOne({ _id: new ObjectId(id) });

    return successResponse(updatedSubmission);
  } catch (error) {
    console.error('Submit submission error:', error);
    return serverError('Failed to submit submission');
  }
}
