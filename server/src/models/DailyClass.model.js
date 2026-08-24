import mongoose from 'mongoose';

const dailyClassSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true,
    },
    classDate: {
      type: Date,
    },
    classNumber: {
      type: Number,
      default: 1,
    },
    videoUrl: {
      type: String,
      default: '',
    },
    youtubePlaylistUrl: {
      type: String,
      default: '',
    },
    duration: {
      type: String,
      default: '',
    },
    isProtected: {
      type: Boolean,
      default: true,
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const DailyClass = mongoose.model('DailyClass', dailyClassSchema);

export default DailyClass;
