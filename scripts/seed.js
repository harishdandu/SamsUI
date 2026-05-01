import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/sams";

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB...");

    // Define a simple User schema for seeding
    const userSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, default: 'admin' }
    });

    const User = mongoose.model('User', userSchema);

    // Clear existing users
    await User.deleteMany({});

    // Hash the password
    const hashedPassword = await bcrypt.hash('Admin2026', 12);

    // Create admin user
    await User.create({
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    });

    console.log("✅ Admin user created successfully!");
    console.log("Username: admin");
    console.log("Password: Admin2026");

    process.exit();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedAdmin();
