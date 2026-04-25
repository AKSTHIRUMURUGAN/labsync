/**
 * Manual seed script for departments collection.
 * Run with: npm run db:seed-departments
 *
 * Reads MONGODB_URI from environment or falls back to localhost.
 * Safe to run multiple times — skips if departments already exist.
 */

const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local so we don't need the dotenv package
function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/labsync';
const MONGODB_DB  = process.env.MONGODB_DB  || 'labsync';

const DEFAULT_DEPARTMENTS = [
  { name: 'Aeronautical Engineering',                          code: 'AERO'   },
  { name: 'Automobile Engineering',                            code: 'AUTO'   },
  { name: 'Biomedical Engineering',                            code: 'BME'    },
  { name: 'Biotechnology',                                     code: 'BT'     },
  { name: 'Chemical Engineering',                              code: 'CHE'    },
  { name: 'Civil Engineering',                                 code: 'CIVIL'  },
  { name: 'Computer Science & Engineering',                    code: 'CSE'    },
  { name: 'Computer Science & Engineering (Cyber Security)',   code: 'CSE-CS' },
  { name: 'Computer Science & Business Systems',               code: 'CSBS'   },
  { name: 'Computer Science & Design',                         code: 'CSD'    },
  { name: 'Electrical & Electronics Engineering',              code: 'EEE'    },
  { name: 'Electronics & Communication Engineering',           code: 'ECE'    },
  { name: 'Food Technology',                                   code: 'FT'     },
  { name: 'Information Technology',                            code: 'IT'     },
  { name: 'Artificial Intelligence & Machine Learning',        code: 'AIML'   },
  { name: 'Artificial Intelligence & Data Science',            code: 'AIDS'   },
  { name: 'Mechanical Engineering',                            code: 'MECH'   },
  { name: 'Mechatronics Engineering',                          code: 'MECT'   },
  { name: 'Robotics & Automation',                             code: 'RA'     },
  { name: 'Humanities & Sciences',                             code: 'HS'     },
  { name: 'Management Studies',                                code: 'MBA'    },
];

const DEFAULT_INSTITUTION_ID = new ObjectId('507f1f77bcf86cd799439011');

async function seedDepartments() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(MONGODB_DB);
    const col = db.collection('departments');

    const existing = await col.countDocuments();
    if (existing >= DEFAULT_DEPARTMENTS.length) {
      console.log(`ℹ️  Already have ${existing} departments — nothing to do.`);
      return;
    }

    const now = new Date();

    // Upsert by code so re-runs are safe
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

    const result = await col.bulkWrite(ops, { ordered: false });
    console.log(`✅ Upserted ${result.upsertedCount} new department(s)\n`);

    // Print full list with IDs
    const all = await col.find({}).sort({ name: 1 }).toArray();
    console.log('Departments in database:');
    all.forEach((d, i) => {
      console.log(`  ${String(i + 1).padStart(2, '0')}. ${d.name.padEnd(55)} [${d._id}]`);
    });

  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n✅ Done.');
  }
}

seedDepartments();
