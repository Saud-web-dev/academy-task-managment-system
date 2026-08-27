import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  basicWork: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  tested: { type: Boolean, default: false },
  // maxMarks: the maximum marks this task can earn (set at creation time)
  maxMarks: { type: Number, default: 100, min: 0, max: 1000 },
  obtainedMarks: { type: Number, default: 0, min: 0 },
  client: { type: String, default: "" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  startDate: { type: Date },
  endDate: { type: Date },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed"],
    default: "Pending",
  },
}, { timestamps: true });

const projectSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  description: { type: String, default: "" },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed"],
    default: "Pending",
  },
  client: { type: String, default: "" },
  startDate: { type: Date },
  endDate: { type: Date },
  tasks: [taskSchema],
  documents: [{ fileName: String, fileUrl: String, publicId: String }],

  // ── Financial fields (superAdmin only) ──────────────────────
  totalPrice: { type: Number, default: 0, min: 0 },
  budget: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: "PKR" },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Partially Paid", "Paid"],
    default: "Pending",
  },
  amountReceived: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

export default mongoose.model("Project", projectSchema);
