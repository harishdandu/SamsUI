import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import Staff from './models/Staff.js';
import User from './models/User.js';

dotenv.config();

const students = [
  { rollNumber: 'S101', firstName: 'John', lastName: 'Doe', class: '10', section: 'A', status: 'Active' },
  { rollNumber: 'S102', firstName: 'Jane', lastName: 'Smith', class: '10', section: 'A', status: 'Active' },
  { rollNumber: 'S103', firstName: 'Mike', lastName: 'Johnson', class: '11', section: 'B', status: 'Active' },
  { rollNumber: 'S104', firstName: 'Sarah', lastName: 'Williams', class: '11', section: 'B', status: 'Inactive' },
  { rollNumber: 'S105', firstName: 'David', lastName: 'Brown', class: '12', section: 'C', status: 'Active' },
];

const staff = [
  { employeeId: 'EMP001', firstName: 'Alice', lastName: 'Johnson', role: 'Super Admin', email: 'alice@school.com', status: 'Active' },
  { employeeId: 'EMP002', firstName: 'Robert', lastName: 'Smith', role: 'Teacher', email: 'robert@school.com', status: 'Active' },
  { employeeId: 'EMP003', firstName: 'Emily', lastName: 'Davis', role: 'Teacher', email: 'emily@school.com', status: 'Active' },
  { employeeId: 'EMP004', firstName: 'Michael', lastName: 'Wilson', role: 'Accountant', email: 'michael@school.com', status: 'Active' },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sams');
    console.log('Connected to MongoDB for seeding');
    
    await Student.deleteMany({});
    console.log('Cleared existing students');
    
    await Student.insertMany(students);
    console.log('Database seeded with students');
    
    await Staff.deleteMany({});
    await Staff.insertMany(staff);
    console.log('Database seeded with staff');

    await User.deleteMany({});
    await User.create({
      username: 'admin',
      password: 'admin123',
      role: 'Super Admin'
    });
    console.log('Database seeded with admin user (admin / admin123)');
    
    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
