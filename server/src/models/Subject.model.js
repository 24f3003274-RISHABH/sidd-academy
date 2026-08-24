import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    chapters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chapter',
      },
    ],
    order: {
      type: Number,
      default: 0,
    },
    icon: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Subject = mongoose.model('Subject', subjectSchema);

export default Subject;
