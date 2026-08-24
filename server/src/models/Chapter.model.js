import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    dailyClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DailyClass',
      },
    ],
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Chapter = mongoose.model('Chapter', chapterSchema);

export default Chapter;
