import mongoose from 'mongoose';

const followUpSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Follow-up title/subject is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ['Call', 'Email', 'Meeting', 'Demo', 'Presentation', 'Other'],
        message: 'Invalid communication type',
      },
      default: 'Call',
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

followUpSchema.index({ user: 1, scheduledDate: 1 });

export const FollowUp = mongoose.models.FollowUp || mongoose.model('FollowUp', followUpSchema);
