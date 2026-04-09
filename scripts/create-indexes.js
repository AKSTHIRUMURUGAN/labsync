const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function createIndexes() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'labsync';

  if (!uri) {
    console.error('MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);

    // Users indexes
    console.log('Creating users indexes...');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ institutionId: 1, role: 1 });
    await db.collection('users').createIndex({ departmentId: 1 });

    // Experiment templates indexes
    console.log('Creating experimentTemplates indexes...');
    await db.collection('experimentTemplates').createIndex({ departmentId: 1, active: 1 });
    await db.collection('experimentTemplates').createIndex({ createdBy: 1 });

    // Lab groups indexes
    console.log('Creating labGroups indexes...');
    await db.collection('labGroups').createIndex({ departmentId: 1, active: 1 });
    await db.collection('labGroups').createIndex({ createdBy: 1 });

    // Submissions indexes
    console.log('Creating submissions indexes...');
    await db.collection('submissions').createIndex(
      { labSessionId: 1, studentId: 1 },
      { unique: true }
    );
    await db.collection('submissions').createIndex({ studentId: 1, status: 1 });
    await db.collection('submissions').createIndex({ status: 1, submittedAt: -1 });
    await db.collection('submissions').createIndex({ reviewedBy: 1, reviewedAt: -1 });
    await db.collection('submissions').createIndex({ flagged: 1 });

    // Lab sessions indexes
    console.log('Creating labSessions indexes...');
    await db.collection('labSessions').createIndex({ labGroupId: 1, status: 1 });
    await db.collection('labSessions').createIndex({ conductedBy: 1, startTime: -1 });
    await db.collection('labSessions').createIndex({ status: 1, startTime: 1 });
    await db.collection('labSessions').createIndex(
      { labGroupId: 1, experimentTemplateId: 1, status: 1 }
    );

    // Notifications indexes
    console.log('Creating notifications indexes...');
    await db.collection('notifications').createIndex({ userId: 1, read: 1, createdAt: -1 });
    await db.collection('notifications').createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    );

    console.log('✓ All indexes created successfully');
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

createIndexes();
