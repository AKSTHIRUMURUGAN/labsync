# Database Seed Scripts

## Seed Database with Test Accounts

This script creates test accounts for all user roles in the LabSync application.

### Usage

```bash
npm run db:seed
```

### What it creates

The seed script will:
1. Clear existing users, institutions, and departments (optional)
2. Create a sample institution: "Sample Engineering College"
3. Create a sample department: "Computer Science and Engineering"
4. Create test user accounts for all roles

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Student | student@test.com | password123 |
| Lab Faculty | faculty@test.com | password123 |
| Faculty Coordinator | coordinator@test.com | password123 |
| HOD | hod@test.com | password123 |
| Principal | principal@test.com | password123 |

### Environment Variables

Make sure your `.env` file has the correct `MONGODB_URI`:

```env
MONGODB_URI=mongodb+srv://i2r:i2r@i2r.5fnktzf.mongodb.net/labsync?retryWrites=true&w=majority&tls=true
```

### Notes

- The script will clear existing data by default. Comment out the delete operations in `seed.js` if you want to preserve existing data.
- All users are assigned to the same institution and department.
- Passwords are hashed using bcrypt with 12 salt rounds.
- All accounts are set to `active: true` by default.

### Customization

To add more users or modify the seed data, edit the `seedUsers` array in `scripts/seed.js`.
