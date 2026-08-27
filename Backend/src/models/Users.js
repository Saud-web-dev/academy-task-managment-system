import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["employee", "teamLeader", "superAdmin"],
    default: "employee",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  totalMarks: {
    type: Number,
    default: 0,
    min: 0,
  },
  manualMarks: {
    type: Number,
    default: 0,
    min: 0,
  },
  marks: {
    type: Number,
    default: 0,
    min: 0,
  },
  workStartTime: {
    type: String,
    default: "",
    trim: true,
  },
  // Push notification subscription (Web Push)
  pushSubscription: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  // Soft-delete flag: set when user is deleted so active sessions get rejected
  deletedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
