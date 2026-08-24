import mongoose from 'mongoose';
import User from '../models/User.model.js';
import Course from '../models/Course.model.js';
import Note from '../models/Note.model.js';
import Banner from '../models/Banner.model.js';
import { mockData } from '../data/mockStore.js';

mongoose.set('bufferCommands', false); // fail fast, don't hang

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sidd-academy';
  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'sidd-academy',
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`✅ [Sidd Academy] Local/Remote MongoDB Connected: ${conn.connection.host}`);
    
    // Seed initial data if MongoDB is fresh/empty
    try {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('🌱 [Sidd Academy] Seeding initial Admin & Student users to MongoDB...');
        for (const u of mockData.users) {
          await User.create({
            name: u.name,
            email: u.email,
            password: u.password,
            role: u.role,
            phone: u.phone,
            avatar: u.avatar,
            isActive: u.isActive,
            purchasedCourses: u.purchasedCourses,
            purchasedNotes: u.purchasedNotes,
          });
        }
      }
      
      const courseCount = await Course.countDocuments();
      if (courseCount === 0) {
        console.log('🌱 [Sidd Academy] Seeding courses to MongoDB...');
        for (const c of mockData.courses) {
          await Course.create({
            title: c.title,
            description: c.description,
            instructor: c.instructor,
            thumbnail: c.thumbnail,
            price: c.price,
            discountPrice: c.discountPrice,
            isFree: c.isFree,
            isPublished: c.isPublished,
            level: c.level,
            category: c.category,
            totalLessons: c.totalLessons,
            totalDuration: c.totalDuration,
            rating: c.rating,
          });
        }
      }

      const noteCount = await Note.countDocuments();
      if (noteCount === 0) {
        console.log('🌱 [Sidd Academy] Seeding modular notes to MongoDB...');
        for (const n of mockData.notes) {
          await Note.create({
            title: n.title,
            description: n.description,
            subject: n.subject,
            level: n.level,
            price: n.price,
            isFree: n.isFree,
            isPublished: n.isPublished,
            pageCount: n.pageCount,
            fileUrl: n.fileUrl,
            thumbnail: n.thumbnail,
          });
        }
      }

      const bannerCount = await Banner.countDocuments();
      if (bannerCount === 0) {
        for (const b of mockData.banners) {
          await Banner.create({
            title: b.title,
            subtitle: b.subtitle,
            imageUrl: b.imageUrl,
            linkUrl: b.linkUrl,
            isActive: b.isActive,
            order: b.order,
          });
        }
      }
    } catch (seedErr) {
      console.warn('⚠️ [Sidd Academy] Seed check warning:', seedErr.message);
    }
  } catch (error) {
    console.warn(`ℹ️ [Sidd Academy] Local MongoDB not running (${error.message}). Running in-memory database store with complete sample data.`);
  }
};

export default connectDB;

