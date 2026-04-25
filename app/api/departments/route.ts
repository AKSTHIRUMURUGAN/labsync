import { NextRequest } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Department } from '@/lib/models/Department';
import { ensureDepartmentsExist } from '@/lib/init-departments';
import { successResponse, serverError } from '@/lib/api-response';

/**
 * GET /api/departments
 *
 * Public endpoint — no auth required so the register page can populate
 * the department dropdown before the user has an account.
 *
 * On first call it auto-seeds the departments collection if it is empty.
 */
export async function GET(_request: NextRequest) {
  try {
    // Auto-create departments if the collection is empty.
    await ensureDepartmentsExist();

    const db = await getDatabase();
    const departments = await db
      .collection<Department>('departments')
      .find({ active: true })
      .sort({ name: 1 })
      .project({ _id: 1, name: 1, code: 1 })
      .toArray();

    return successResponse(departments);
  } catch (error) {
    console.error('Get departments error:', error);
    return serverError('Failed to fetch departments');
  }
}
