const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/labsync';

async function seed() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('\nClearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('institutions').deleteMany({});
    await db.collection('departments').deleteMany({});
    console.log('✓ Cleared existing data');

    // Create institution
    const institutionId = new ObjectId();
    const institution = {
      _id: institutionId,
      name: 'Sample Engineering College',
      code: 'SEC',
      address: '123 College Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('institutions').insertOne(institution);
    console.log('✓ Created institution:', institution.name);

    // Create department
    const departmentId = new ObjectId();
    const department = {
      _id: departmentId,
      institutionId,
      name: 'Computer Science and Engineering',
      code: 'CSE',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('departments').insertOne(department);
    console.log('✓ Created department:', department.name);

    // Seed users
    const seedUsers = [
      {
        email: 'student@test.com',
        password: 'password123',
        role: 'student',
        firstName: 'John',
        lastName: 'Doe',
        enrollmentNumber: 'CSE2024001',
      },
      {
        email: 'faculty@test.com',
        password: 'password123',
        role: 'lab_faculty',
        firstName: 'Dr. Jane',
        lastName: 'Smith',
        employeeId: 'FAC001',
      },
      {
        email: 'coordinator@test.com',
        password: 'password123',
        role: 'faculty_coordinator',
        firstName: 'Prof. Robert',
        lastName: 'Johnson',
        employeeId: 'FAC002',
      },
      {
        email: 'hod@test.com',
        password: 'password123',
        role: 'hod',
        firstName: 'Dr. Sarah',
        lastName: 'Williams',
        employeeId: 'HOD001',
      },
      {
        email: 'principal@test.com',
        password: 'password123',
        role: 'principal',
        firstName: 'Dr. Michael',
        lastName: 'Brown',
        employeeId: 'PRIN001',
      },
    ];

    console.log('\nCreating users...');
    for (const userData of seedUsers) {
      const passwordHash = await bcrypt.hash(userData.password, 12);

      const user = {
        email: userData.email,
        passwordHash,
        role: userData.role,
        firstName: userData.firstName,
        lastName: userData.lastName,
        institutionId,
        departmentId,
        enrollmentNumber: userData.enrollmentNumber,
        employeeId: userData.employeeId,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection('users').insertOne(user);
      console.log(`✓ Created ${userData.role}: ${userData.email} (password: ${userData.password})`);
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║           TEST ACCOUNTS CREATED                ║');
    console.log('╠════════════════════════════════════════════════╣');
    console.log('║ Student:      student@test.com / password123   ║');
    console.log('║ Lab Faculty:  faculty@test.com / password123   ║');
    console.log('║ Coordinator:  coordinator@test.com / password123║');
    console.log('║ HOD:          hod@test.com / password123       ║');
    console.log('║ Principal:    principal@test.com / password123 ║');
    console.log('╚════════════════════════════════════════════════╝');

  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the seed function
seed();
