import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/simulator');
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Audit Log Schema (same as in AuditLoggerService.js)
const AuditLogSchema = new mongoose.Schema({
  event: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  username: { type: String, index: true },
  role: String,
  discipline: String,
  ip: { type: String, index: true },
  userAgent: String,
  path: String,
  method: String,
  reason: String,
  error: String,
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, index: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' }
}, { timestamps: true });

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

// Delete all audit logs
const deleteAllAuditLogs = async () => {
  try {
    console.log('Starting audit log cleanup...');

    // Count total logs before deletion
    const totalLogs = await AuditLog.countDocuments();
    console.log(`Found ${totalLogs} audit log records`);

    if (totalLogs === 0) {
      console.log('No audit logs to delete');
      return;
    }

    // Delete all logs
    const result = await AuditLog.deleteMany({});
    console.log(`Deleted ${result.deletedCount} audit log records`);

    // Verify deletion
    const remainingLogs = await AuditLog.countDocuments();
    console.log(`Remaining audit logs: ${remainingLogs}`);

    if (remainingLogs === 0) {
      console.log('✅ All audit logs successfully deleted!');
    } else {
      console.log('⚠️ Some logs may still remain');
    }

  } catch (error) {
    console.error('Error deleting audit logs:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await deleteAllAuditLogs();
  await mongoose.connection.close();
  console.log('Database connection closed');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('Script execution failed:', error);
  process.exit(1);
});