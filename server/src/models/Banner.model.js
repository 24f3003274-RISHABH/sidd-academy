import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
    badge: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    linkUrl: {
      type: String,
      default: '',
    },
    buttonText: {
      type: String,
      default: 'Learn More',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    bgColor: {
      type: String,
      default: '#6c63ff',
    },
  },
  { timestamps: true }
);

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;
