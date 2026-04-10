import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/middleware/auth-middleware';
import { getDatabase } from '@/lib/mongodb';
import { ExperimentTemplate } from '@/lib/models/ExperimentTemplate';
import { successResponse, notFoundError, serverError } from '@/lib/api-response';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, ['student', 'faculty_coordinator', 'lab_faculty', 'hod', 'principal']);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { id } = await params;
    const db = await getDatabase();
    const template = await db
      .collection<ExperimentTemplate>('experimentTemplates')
      .findOne({ _id: new ObjectId(id) });

    if (!template) {
      return notFoundError('Template not found');
    }

    return successResponse(template);
  } catch (error) {
    console.error('Get template error:', error);
    return notFoundError('Template not found');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, ['lab_faculty', 'faculty_coordinator', 'hod', 'principal']);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const db = await getDatabase();

    // Update the template directly (simpler approach)
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.title) updateData.title = body.title;
    if (body.description) updateData.description = body.description;
    if (body.objectives) updateData.objectives = body.objectives;
    if (body.steps) updateData.steps = body.steps;
    if (body.sections) updateData.sections = body.sections; // Save sections

    const result = await db
      .collection<ExperimentTemplate>('experimentTemplates')
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

    if (!result) {
      return notFoundError('Template not found');
    }

    return successResponse(result);
  } catch (error) {
    console.error('Update template error:', error);
    return serverError('Failed to update template');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireRole(request, ['lab_faculty', 'faculty_coordinator', 'hod', 'principal']);
  
  if (authResult instanceof Response) {
    return authResult;
  }

  try {
    const { id } = await params;
    const db = await getDatabase();

    // Check if template has associated submissions
    const submissionCount = await db
      .collection('submissions')
      .countDocuments({ experimentTemplateId: new ObjectId(id) });

    if (submissionCount > 0) {
      return serverError('Cannot delete template with associated submissions');
    }

    await db
      .collection<ExperimentTemplate>('experimentTemplates')
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { active: false, updatedAt: new Date() } }
      );

    return successResponse({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    return serverError('Failed to delete template');
  }
}
