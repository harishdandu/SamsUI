import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const schoolProfileSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  schoolName: {
    type: String,
    required: true
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isProfileCompleted: {
    type: Boolean,
    default: false
  },
  phone: String,
  plotNo: String,
  streetName: String,
  mandal: String,
  district: String,
  state: String,
  logo: String,
  otp: String,
  otpExpires: Date
}, { timestamps: true });

schoolProfileSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

schoolProfileSchema.methods.comparePassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const SchoolProfile = mongoose.model('SchoolProfile', schoolProfileSchema);

export default SchoolProfile;
