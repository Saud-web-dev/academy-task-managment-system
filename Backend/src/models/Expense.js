import mongoose from "mongoose";

export const EXPENSE_CATEGORIES = [
  "Office Rent", "Electricity", "Internet", "Salaries",
  "Software", "Hosting", "Domain", "Marketing", "Advertising",
  "Equipment", "Computer/Laptop", "Furniture", "Transportation",
  "Travel", "Food", "Maintenance", "Utilities", "Office Supplies",
  "Project Expense", "Other",
];

const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  amount: { type: Number, required: true, min: 0 },
  category: { type: String, required: true, trim: true },
  expenseDate: { type: Date, required: true },
  paymentMethod: {
    type: String,
    enum: ["Cash", "Bank Transfer", "Card", "JazzCash", "EasyPaisa", "Other"],
    default: "Cash",
  },
  vendor: { type: String, default: "", trim: true },
  invoiceNumber: { type: String, default: "", trim: true },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    default: null,
  },
  status: {
    type: String,
    enum: ["Paid", "Pending", "Cancelled"],
    default: "Paid",
  },
  notes: { type: String, default: "" },
  receipt: {
    fileName: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    publicId: { type: String, default: "" },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
}, { timestamps: true });

expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ project: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ createdBy: 1 });

export default mongoose.model("Expense", expenseSchema);
