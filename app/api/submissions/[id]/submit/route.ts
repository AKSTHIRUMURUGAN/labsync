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

function hasAllRequiredTableInputs(tableData: any): boolean {
  if (!tableData || !Array.isArray(tableData.rows) || !Array.isArray(tableData.columns)) {
    return false;
  }

  const inputColumns = tableData.columns.filter((col: any) => col?.type === 'input');
  if (inputColumns.length === 0 || tableData.rows.length === 0) {
    return false;
  }

  return tableData.rows.every((row: any) =>
    inputColumns.every((col: any) => {
      const value = row?.values?.[col.id];
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      return value !== undefined && value !== null && value !== '';
    })
  );
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
          (section?.type === 'text' ||
            section?.type === 'table' ||
            section?.type === 'code' ||
            section?.type === 'imageUpload' ||
            section?.type === 'fileUpload')
      );

      const missingSections: string[] = [];
      const sectionData = (submission as any).sectionData || {};

      for (const section of editableSections) {
        const data = sectionData?.[section.id];
        const sectionLabel = section.title || section.content?.name || section.content?.problemTitle || section.type;

        if (section.type === 'text') {
          if (!isNonEmptyString(data?.data)) {
            missingSections.push(sectionLabel || 'Text section');
          }
        } else if (section.type === 'table') {
          if (!hasAllRequiredTableInputs(data?.data)) {
            missingSections.push(sectionLabel || 'Observation Table');
          }
        } else if (section.type === 'code') {
          if (!isNonEmptyString(data?.data?.code)) {
            missingSections.push(sectionLabel || 'Code section');
          }
        } else if (section.type === 'imageUpload' || section.type === 'fileUpload') {
          if (!data?.data) {
            missingSections.push(sectionLabel);
          }
        }
      }

      if (missingSections.length > 0) {
        errors.content = `Please complete all editable sections before submitting: ${missingSections.join(', ')}`;
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
