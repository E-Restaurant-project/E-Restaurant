import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true
    },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminName: { type: String, required: true, default: 'Admin' },
    adminEmail: { type: String, default: '' },
    targetType: { type: String, default: 'dish' },
    targetId: { type: String, default: '' },
    targetName: { type: String, default: '' },
    details: { type: String, default: '' }
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

