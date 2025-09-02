import mongoose from 'mongoose';

const UserPrivacySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    showInLeaderboard: {
      type: Boolean,
      default: true
    },
    showRealName: {
      type: Boolean,
      default: false
    },
    shareProgressWithEducators: {
      type: Boolean,
      default: true
    },
    allowAnonymousAnalytics: {
      type: Boolean,
      default: true
    },
    dataRetentionPeriod: {
      type: String,
      enum: ['forever', '1year', '2years', '5years'],
      default: '2years'
    },
    profileVisibility: {
      type: String,
      enum: ['public', 'educators', 'private'],
      default: 'educators'
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
UserPrivacySchema.index({ userId: 1 });

const UserPrivacy = mongoose.model('UserPrivacy', UserPrivacySchema);

export default UserPrivacy;