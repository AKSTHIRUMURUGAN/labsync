import { NextRequest } from 'next/server';
import { requireAuth, requireRole } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { Submission } from '@/lib/models/Submission';
import { LabSession } from '@/lib/models/LabSession';
import { successResponse, validationError, conflictError, serverError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const labSessionId = searchParams.get('labSessionId');
    const studentId = searchParams.get('studentId');

    const db = await getDatabase();
    const query: any = {};

    // Students can only see their own submissions
    if (authResult.role === 'student') {
      query.studentId = new ObjectId(authResult.userId);
    } else if (studentId) {
      query.studentId = new ObjectId(studentId);
    }

    if (status) {
      query.status = status;
    }

    if (labSessionId) {
      query.labSessionId = new ObjectId(labSessionId);
    }

    const skip = (page - 1) * limit;
    const submissions = await db
      .collection<Submission>('submissions')
      .aggregate([
        { $match: query },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'studentId',
            foreignField: '_id',
            as: 'student'
          }
        },
        {
          $addFields: {
            studentName: {
              $concat: [
                { $arrayElemAt: ['$student.firstName', 0] },
                ' ',
                { $arrayElemAt: ['$student.lastName', 0] }
              ]
            }
          }
        },
        {
          $project: {
            student: 0
          }
        }
      ])
      .toArray();

    const total = await db.collection<Submission>('submissions').countDocuments(query);

    return successResponse(submissions, { page, limit, total });
  } catch (error) {
    console.error('Get submissions error:', error);
    return serverError('Failed to fetch submissions');
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireRole(request, ['student']);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { labSessionId, experimentTemplateId, experimentTitle, observationData, calculations, results, conclusion, status, templateData, sectionData } = body;

    // Validation
    const errors: { [key: string]: string } = {};
    if (!labSessionId) errors.labSessionId = 'Lab session ID is required';
    if (!experimentTemplateId) errors.experimentTemplateId = 'Template ID is required';

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    const db = await getDatabase();

    // Check if session is active
    const session = await db
      .collection<LabSession>('labSessions')
      .findOne({ _id: new ObjectId(labSessionId) });

    if (!session) {
      return validationError({ labSessionId: 'Session not found' });
    }

    // If submitting (not saving draft), validate that editable sections have content
    if (status === 'submitted') {
      const template = await db
        .collection('experimentTemplates')
        .findOne({ _id: new ObjectId(experimentTemplateId) });

      if (template?.sections && Array.isArray(template.sections)) {
        const editableSections = template.sections.filter(
          (s: any) => s.editable && ['text', 'table', 'code', 'imageUpload', 'fileUpload'].includes(s.type)
        );

        const missingSections: string[] = [];

        for (const section of editableSections) {
          const data = sectionData?.[section.id];

          if (section.type === 'text') {
            if (!data?.data || String(data.data).trim().length === 0) {
              missingSections.push(section.title || section.id);
            }
          } else if (section.type === 'table') {
            const tableData = data?.data;
            const hasData = tableData?.rows?.some((row: any) =>
              tableData.columns?.some(
                (col: any) => col.type === 'input' && row.values?.[col.id] !== undefined && row.values?.[col.id] !== ''
              )
            );
            if (!hasData) {
              missingSections.push(tableData?.name || section.content?.name || section.id);
            }
          } else if (section.type === 'code') {
            if (!data?.data?.code || String(data.data.code).trim().length === 0) {
              missingSections.push(section.content?.problemTitle || section.id);
            }
          } else if (section.type === 'imageUpload' || section.type === 'fileUpload') {
            if (!data?.data) {
              missingSections.push(section.title || section.id);
            }
          }
        }

        if (missingSections.length > 0) {
          return validationError({
            content: `Please fill in all required sections before submitting: ${missingSections.join(', ')}`,
          });
        }
      } else {
        // Fallback: legacy form — require at least one of observations/results/conclusion
        const hasObservations = observationData && observationData.length > 0;
        const hasResults = results && String(results).trim().length > 0;
        const hasConclusion = conclusion && String(conclusion).trim().length > 0;

        if (!hasObservations && !hasResults && !hasConclusion) {
          return validationError({
            content: 'Please fill in at least observations, results, or conclusion before submitting',
          });
        }
      }
    }

    // Get template for title if not provided
    let title = experimentTitle;
    if (!title) {
      const template = await db
        .collection('experimentTemplates')
        .findOne({ _id: new ObjectId(experimentTemplateId) });
      title = template?.title || 'Lab Experiment';
    }

    // Check for existing submission
    const existingSubmission = await db
      .collection<Submission>('submissions')
      .findOne({
        labSessionId: new ObjectId(labSessionId),
        studentId: new ObjectId(authResult.userId),
      });

    if (existingSubmission) {
      return conflictError('Submission already exists for this session');
    }

    const submission: any = {
      labSessionId: new ObjectId(labSessionId),
      studentId: new ObjectId(authResult.userId),
      experimentTemplateId: new ObjectId(experimentTemplateId),
      experimentTitle: title,
      templateVersion: session.templateVersion,
      status: status || 'in_progress',
      observationData: observationData || [],
      proofImages: [],
      calculations: calculations || [],
      results: results || '',
      conclusion: conclusion || '',
      templateData: templateData || {},
      sectionData: sectionData || {}, // Save section data (code and tables)
      editHistory: [],
      flagged: false,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (status === 'submitted') {
      submission.submittedAt = new Date();
    }

    const result = await db.collection('submissions').insertOne(submission);
    submission._id = result.insertedId;

    return successResponse(submission);
  } catch (error) {
    console.error('Create submission error:', error);
    return serverError('Failed to create submission');
  }
}
