import mongoose from "mongoose";

// Each document = one deduction receipt/entry for a user
const scoreDeductionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    // Type of deduction
    deductionType: {
      type: String,
      enum: [
        "late_arrival",     // Late aaya
        "absent",           // Absent
        "deadline_missed",  // Task deadline miss
        "daily_update_miss",// Daily update submit nahi kiya
        "manual",           // Admin ne manually cut kiya
      ],
      required: true,
    },
    // Marks deducted
    marksDeducted: {
      type: Number,
      required: true,
      min: 0,
    },
    // Marks before deduction
    marksBefore: {
      type: Number,
      required: true,
      default: 0,
    },
    // Marks after deduction
    marksAfter: {
      type: Number,
      required: true,
      default: 0,
    },
    // Reason shown in receipt
    reason: {
      type: String,
      required: true,
    },
    // Auto generated reason (for system cuts)
    autoReason: {
      type: String,
      default: "",
    },
    // Date the deduction applies to (e.g. attendance date)
    date: {
      type: Date,
      required: true,
    },
    // Attendance details (if applicable)
    attendanceDetails: {
      arrivalTime: { type: String, default: "" },
      expectedTime: { type: String, default: "" },
      lateByMinutes: { type: Number, default: 0 },
      hoursWorked: { type: Number, default: 0 },
      totalHoursRequired: { type: Number, default: 0 },
    },
    // Task details (if deadline missed)
    taskDetails: {
      taskId: { type: mongoose.Schema.Types.ObjectId, default: null },
      taskName: { type: String, default: "" },
      projectName: { type: String, default: "" },
      deadlineDate: { type: Date, default: null },
    },
    // Who applied the deduction
    appliedBy: {
      type: String,
      enum: ["admin", "system"],
      default: "admin",
    },
    appliedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Notes
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

scoreDeductionSchema.index({ userId: 1, date: -1 });
scoreDeductionSchema.index({ deductionType: 1 });
scoreDeductionSchema.index({ date: -1 });

export default mongoose.model("ScoreDeduction", scoreDeductionSchema);
