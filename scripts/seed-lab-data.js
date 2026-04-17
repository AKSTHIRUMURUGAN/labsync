const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/labsync';

async function seedLabData() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();

    // Get the institution and department
    const institution = await db.collection('institutions').findOne({});
    const department = await db.collection('departments').findOne({});
    
    if (!institution || !department) {
      console.error('❌ Please run the main seed script first (npm run db:seed)');
      process.exit(1);
    }

    // Get faculty user
    const faculty = await db.collection('users').findOne({ role: 'lab_faculty' });
    const student = await db.collection('users').findOne({ role: 'student' });

    if (!faculty || !student) {
      console.error('❌ Please run the main seed script first (npm run db:seed)');
      process.exit(1);
    }

    console.log('\nCreating experiment templates...');

    // Create experiment templates
    const templates = [
      {
        version: '1.0.0',
        title: 'Introduction to Python Programming',
        description: 'Learn the basics of Python programming including variables, data types, and control structures.',
        objectives: [
          'Understand Python syntax and basic data types',
          'Learn to use control structures (if, for, while)',
          'Practice writing simple Python programs'
        ],
        steps: [
          'Install Python and set up the development environment',
          'Write a Hello World program',
          'Create variables and perform basic operations',
          'Implement conditional statements',
          'Use loops to iterate over data'
        ],
        observationTables: [
          {
            name: 'Program Output',
            columns: ['Program', 'Expected Output', 'Actual Output', 'Status'],
            rows: 5
          }
        ],
        requiredFields: ['code', 'output', 'observations'],
        calculationRules: [],
        createdBy: faculty._id,
        departmentId: department._id,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        version: '1.0.0',
        title: 'Data Structures - Arrays and Linked Lists',
        description: 'Implement and analyze basic data structures including arrays and linked lists.',
        objectives: [
          'Understand array operations and complexity',
          'Implement singly and doubly linked lists',
          'Compare performance of different data structures'
        ],
        steps: [
          'Implement array operations (insert, delete, search)',
          'Create a linked list class',
          'Implement linked list operations',
          'Measure time complexity',
          'Compare array vs linked list performance'
        ],
        observationTables: [
          {
            name: 'Performance Comparison',
            columns: ['Operation', 'Array Time (ms)', 'Linked List Time (ms)', 'Observations'],
            rows: 5
          }
        ],
        requiredFields: ['implementation', 'analysis', 'conclusion'],
        calculationRules: [],
        createdBy: faculty._id,
        departmentId: department._id,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        version: '1.0.0',
        title: 'Database Design and SQL Queries',
        description: 'Design a database schema and write SQL queries for data manipulation.',
        objectives: [
          'Design normalized database schemas',
          'Write SQL queries for CRUD operations',
          'Understand joins and subqueries'
        ],
        steps: [
          'Analyze requirements and design ER diagram',
          'Create database tables',
          'Insert sample data',
          'Write SELECT queries with various conditions',
          'Implement JOIN operations'
        ],
        observationTables: [
          {
            name: 'Query Results',
            columns: ['Query Description', 'SQL Query', 'Result Count', 'Execution Time'],
            rows: 5
          }
        ],
        requiredFields: ['schema', 'queries', 'results'],
        calculationRules: [],
        createdBy: faculty._id,
        departmentId: department._id,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    const templateResults = await db.collection('experimentTemplates').insertMany(templates);
    const templateIds = Object.values(templateResults.insertedIds);
    console.log(`✓ Created ${templateIds.length} experiment templates`);

    console.log('\nCreating lab groups...');

    // Create lab groups
    const labGroups = [
      {
        name: 'CSE Batch A',
        className: 'Third Year CSE',
        semester: 'Semester 5',
        academicYear: '2024-2025',
        departmentId: department._id,
        students: [student._id],
        experimentTemplates: templateIds,
        createdBy: faculty._id,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'CSE Batch B',
        className: 'Third Year CSE',
        semester: 'Semester 5',
        academicYear: '2024-2025',
        departmentId: department._id,
        students: [student._id],
        experimentTemplates: templateIds,
        createdBy: faculty._id,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    const groupResults = await db.collection('labGroups').insertMany(labGroups);
    console.log(`✓ Created ${Object.keys(groupResults.insertedIds).length} lab groups`);

    console.log('\n✅ Lab data seed completed successfully!');
    console.log('\nCreated:');
    console.log(`- ${templateIds.length} experiment templates`);
    console.log(`- ${Object.keys(groupResults.insertedIds).length} lab groups`);
    console.log('\nYou can now create lab sessions at: http://localhost:3000/faculty/sessions/new');

  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

seedLabData();
