/**
 * Ensures the departments collection is fully populated on first app start.
 * Called from the departments API route — runs lazily on first request.
 *
 * Strategy: if the collection has fewer documents than the canonical list,
 * upsert all missing departments by code so it is always complete.
 */
import { ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';
import { Department } from './models/Department';
import { DEFAULT_DEPARTMENTS } from './data/departments';

// Default institution ID — must match the fallback used in the register route.
const DEFAULT_INSTITUTION_ID = new ObjectId('507f1f77bcf86cd799439011');

let initialized = false;

export async function ensureDepartmentsExist(): Promise<void> {
  if (initialized) return;

  const db = await getDatabase();
  const col = db.collection<Department>('departments');

  const count = await col.countDocuments();

  if (count < DEFAULT_DEPARTMENTS.length) {
    const now = new Date();

    // Upsert each department by code — safe to run multiple times.
    const ops = DEFAULT_DEPARTMENTS.map((d) => ({
      updateOne: {
        filter: { code: d.code },
        update: {
          $setOnInsert: {
            name: d.name,
            code: d.code,
            institutionId: DEFAULT_INSTITUTION_ID,
            active: true,
            createdAt: now,
            updatedAt: now,
          },
        },
        upsert: true,
      },
    }));

    await col.bulkWrite(ops, { ordered: false });
    console.log(`[LabSync] Departments collection synced — ${DEFAULT_DEPARTMENTS.length} departments ensured.`);
  }

  initialized = true;
}
