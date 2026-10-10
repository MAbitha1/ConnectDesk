import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Lead', 'Contacted', 'Proposal', 'Customer', 'Inactive'],
      default: 'Lead',
    },
    dealValue: {
      type: Number,
      min: [0, 'Deal value cannot be negative'],
      default: 0,
    },
    lastContact: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user and email uniqueness per user workspace
customerSchema.index({ user: 1, email: 1 }, { unique: true });

export const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
