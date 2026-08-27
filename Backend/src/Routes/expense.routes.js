import express from "express";
import multer from "multer";
import checkToken from "../Middleware/checkToken.js";
import { requireSuperAdmin } from "../Middleware/authorization.js";
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  getFinancialDashboard,
  getFinancialReports,
} from "../Controllers/expense.controller.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg", "image/png", "image/webp",
      "application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type for receipt"), false);
  },
});

// All expense routes are superAdmin only
router.use(checkToken, requireSuperAdmin);

// Expenses CRUD
router.get("/categories", getExpenseCategories);
router.get("/", getAllExpenses);
router.get("/:id", getExpenseById);
router.post("/", upload.single("receipt"), createExpense);
router.put("/:id", upload.single("receipt"), updateExpense);
router.delete("/:id", deleteExpense);

// Financial dashboard + reports
router.get("/finance/dashboard", getFinancialDashboard);
router.get("/finance/reports", getFinancialReports);

export default router;
