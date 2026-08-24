import mongoose from 'mongoose';

mongoose.set('bufferCommands', false); // fail fast, don't hang

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn('⚠️ [Sidd Academy] MONGODB_URI not provided. Server will run with in-memory database.');
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'sidd-academy',
      serverSelectionTimeoutMS: 4000,
    });
    console.log(`✅ [Sidd Academy] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ [Sidd Academy] MongoDB connection warning: ${error.message} — in-memory fallback active`);
  }
};

export default connectDB;

