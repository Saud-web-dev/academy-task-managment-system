import mongoose from "mongoose";

const dailyUpdateSchema = new mongoose.Schema(
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
    // The date this update is for (normalized to start of day)
    date: {
      type: Date,
      required: true,
    },
    // Update content
    updateText: {
      type: String,
      required: true,
      trim: true,
    },
    // Tasks worked on today
    tasksWorkedOn: [
      {
        taskName: { type: String, default: "" },
        projectName: { type: String, default: "" },
        progress: { type: String, default: "" }, // e.g. "50%", "Completed"
        hoursSpent: { type: Number, default: 0 },
      },
    ],
    // Overall hours worked today
    hoursWorked: {
      type: Number,
      default: 0,
      min: 0,
      max: 24,
    },
    // Status
    status: {
      type: String,
      enum: ["submitted", "missed"],
      default: "submitted",
    },
    // Admin can add remarks
    adminRemarks: {
      type: String,
      default: "",
    },
    // Was a penalty applied for missing this?
    penaltyApplied: {
      type: Boolean,
      default: false,
    },
    penaltyMarks: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// One update per user per day
dailyUpdateSchema.index({ userId: 1, date: 1 }, { unique: true });
dailyUpdateSchema.index({ date: -1 });
dailyUpdateSchema.index({ status: 1 });

export default mongoose.model("DailyUpdate", dailyUpdateSchema);
