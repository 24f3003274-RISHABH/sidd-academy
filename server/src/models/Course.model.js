import mongoose from 'mongoose';

const syllabusItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
}, { _id: false });

const courseSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Course title is required'], trim: true },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String, required: [true, 'Course description is required'] },
  thumbnail: { type: String, default: '' },
  instructor: { type: String, default: 'Sidd Academy Team' },
  duration: { type: String, default: '' },
  language: { type: String, default: 'Hindi / English' },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'], default: 'All Levels' },
  price: { type: Number, default: 0, min: 0 },
  isFree: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: false },
  syllabus: [syllabusItemSchema],
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  totalStudents: { type: Number, default: 0 },
  tags: [String],
  order: { type: Number, default: 0 },
}, { timestamps: true });

courseSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

const Course = mongoose.model('Course', courseSchema);
export default Course;
