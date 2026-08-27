import Expense, { EXPENSE_CATEGORIES } from "../models/Expense.js";
import Project from "../models/Project.js";
import cloudinary from "../config/cloudinary.js";

// ── Currency formatter helper ─────────────────────────────────────
export const formatCurrency = (amount, currency = "PKR") =>
  `${currency} ${Number(amount || 0).toLocaleString("en-PK")}`;

// ============================================
// GET ALL EXPENSES (with filters, search, sort, pagination)
// ============================================
export const getAllExpenses = async (req, res) => {
  try {
    const {
      page = 1, limit = 20,
      startDate, endDate,
      category, project, paymentMethod, status,
      search, sortBy = "expenseDate", order = "desc",
    } = req.query;

    const query = {};

    if (category) query.category = category;
    if (project) query.project = project;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { vendor: { $regex: search, $options: "i" } },
        { invoiceNumber: { $regex: search, $options: "i" } },
      ];
    }

    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.expenseDate.$lte = end;
      }
    }

    const sortOptions = { [sortBy]: order === "asc" ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, total] = await Promise.all([
      Expense.find(query)
        .populate("project", "projectName")
        .populate("createdBy", "name email")
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Expense.countDocuments(query),
    ]);

    const totalAmount = data.reduce((s, e) => s + (e.amount || 0), 0);

    res.status(200).json({
      success: true,
      data,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET SINGLE EXPENSE
// ============================================
export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate("project", "projectName")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });

    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// CREATE EXPENSE
// ============================================
export const createExpense = async (req, res) => {
  try {
    const {
      title, description, amount, category, expenseDate,
      paymentMethod, vendor, invoiceNumber, project, status, notes,
    } = req.body;

    if (!title || !amount || !category || !expenseDate) {
      return res.status(400).json({
        success: false,
        message: "title, amount, category and expenseDate are required",
      });
    }

    if (Number(amount) < 0) {
      return res.status(400).json({ success: false, message: "Amount cannot be negative" });
    }

    // Validate project reference
    if (project) {
      const proj = await Project.findById(project);
      if (!proj) return res.status(400).json({ success: false, message: "Invalid project ID" });
    }

    let receiptData = {};
    if (req.file) {
      try {
        const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
        const result = await cloudinary.uploader.upload(fileBase64, {
          folder: "expenses/receipts",
          resource_type: "auto",
        });
        receiptData = { fileName: req.file.originalname, fileUrl: result.secure_url, publicId: result.public_id };
      } catch (uploadErr) {
        // Receipt upload failure is non-fatal
      }
    }

    const expense = await Expense.create({
      title: title.trim(),
      description: description || "",
      amount: parseFloat(Number(amount).toFixed(2)),
      category,
      expenseDate: new Date(expenseDate),
      paymentMethod: paymentMethod || "Cash",
      vendor: vendor || "",
      invoiceNumber: invoiceNumber || "",
      project: project || null,
      status: status || "Paid",
      notes: notes || "",
      receipt: receiptData,
      createdBy: req.user.id,
    });

    await expense.populate("project", "projectName");
    await expense.populate("createdBy", "name email");

    res.status(201).json({ success: true, message: "Expense added successfully", data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// UPDATE EXPENSE
// ============================================
export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });

    const {
      title, description, amount, category, expenseDate,
      paymentMethod, vendor, invoiceNumber, project, status, notes,
    } = req.body;

    if (title !== undefined) expense.title = title.trim();
    if (description !== undefined) expense.description = description;
    if (amount !== undefined) expense.amount = parseFloat(Number(amount).toFixed(2));
    if (category !== undefined) expense.category = category;
    if (expenseDate !== undefined) expense.expenseDate = new Date(expenseDate);
    if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;
    if (vendor !== undefined) expense.vendor = vendor;
    if (invoiceNumber !== undefined) expense.invoiceNumber = invoiceNumber;
    if (project !== undefined) expense.project = project || null;
    if (status !== undefined) expense.status = status;
    if (notes !== undefined) expense.notes = notes;
    expense.updatedBy = req.user.id;

    // Handle new receipt upload
    if (req.file) {
      try {
        if (expense.receipt?.publicId) {
          await cloudinary.uploader.destroy(expense.receipt.publicId, { resource_type: "auto" });
        }
        const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
        const result = await cloudinary.uploader.upload(fileBase64, {
          folder: "expenses/receipts",
          resource_type: "auto",
        });
        expense.receipt = { fileName: req.file.originalname, fileUrl: result.secure_url, publicId: result.public_id };
      } catch (uploadErr) {
        // Non-fatal
      }
    }

    await expense.save();
    await expense.populate("project", "projectName");
    await expense.populate("createdBy", "name email");

    res.status(200).json({ success: true, message: "Expense updated successfully", data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// DELETE EXPENSE
// ============================================
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: "Expense not found" });

    if (expense.receipt?.publicId) {
      try {
        await cloudinary.uploader.destroy(expense.receipt.publicId, { resource_type: "auto" });
      } catch { /* non-fatal */ }
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `Expense "${expense.title}" deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// GET EXPENSE CATEGORIES
// ============================================
export const getExpenseCategories = async (req, res) => {
  res.status(200).json({ success: true, data: EXPENSE_CATEGORIES });
};

// ============================================
// FINANCIAL DASHBOARD DATA
// GET /api/finance/dashboard
// ============================================
export const getFinancialDashboard = async (req, res) => {
  try {
    const { period = "this_month", startDate, endDate } = req.query;

    // Build date range
    const now = new Date();
    let dateFrom, dateTo;

    switch (period) {
      case "today":
        dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateTo = new Date(dateFrom.getTime() + 86400000 - 1);
        break;
      case "this_week": {
        const day = now.getDay();
        dateFrom = new Date(now); dateFrom.setDate(now.getDate() - day); dateFrom.setHours(0,0,0,0);
        dateTo = new Date(dateFrom); dateTo.setDate(dateFrom.getDate() + 6); dateTo.setHours(23,59,59,999);
        break;
      }
      case "this_month":
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case "last_month":
        dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        dateTo = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;
      case "this_year":
        dateFrom = new Date(now.getFullYear(), 0, 1);
        dateTo = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case "custom":
        dateFrom = startDate ? new Date(startDate) : new Date(now.getFullYear(), 0, 1);
        dateTo = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : now;
        break;
      default:
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const expenseMatch = { status: { $ne: "Cancelled" }, expenseDate: { $gte: dateFrom, $lte: dateTo } };

    // Parallel queries
    const [
      expenseAgg, categoryAgg, projectsFinancial, recentExpenses,
    ] = await Promise.all([
      Expense.aggregate([
        { $match: expenseMatch },
        { $group: { _id: null, totalExpenses: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Expense.aggregate([
        { $match: expenseMatch },
        { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Project.aggregate([
        { $group: {
          _id: null,
          totalProjectValue: { $sum: "$totalPrice" },
          totalReceived: { $sum: "$amountReceived" },
          projectCount: { $sum: 1 },
        }},
      ]),
      Expense.find(expenseMatch)
        .populate("project", "projectName")
        .sort({ expenseDate: -1 })
        .limit(5),
    ]);

    const totalExpenses = expenseAgg[0]?.totalExpenses || 0;
    const totalProjectValue = projectsFinancial[0]?.totalProjectValue || 0;
    const totalReceived = projectsFinancial[0]?.totalReceived || 0;
    const pendingReceivables = Math.max(0, totalProjectValue - totalReceived);
    const cashProfit = totalReceived - totalExpenses;
    const estimatedProfit = totalProjectValue - totalExpenses;

    res.status(200).json({
      success: true,
      period,
      dateFrom,
      dateTo,
      data: {
        totalProjectValue,
        totalReceived,
        pendingReceivables,
        totalExpenses,
        cashProfit,
        estimatedProfit,
        expenseCount: expenseAgg[0]?.count || 0,
        projectCount: projectsFinancial[0]?.projectCount || 0,
        categoryBreakdown: categoryAgg,
        recentExpenses,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// FINANCIAL REPORTS
// GET /api/finance/reports
// ============================================
export const getFinancialReports = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const yearInt = parseInt(year);
    const yearStart = new Date(yearInt, 0, 1);
    const yearEnd = new Date(yearInt, 11, 31, 23, 59, 59, 999);

    const [monthlyExpenses, categoryBreakdown, projectProfitability] = await Promise.all([
      // Monthly expenses for the year
      Expense.aggregate([
        { $match: { status: { $ne: "Cancelled" }, expenseDate: { $gte: yearStart, $lte: yearEnd } } },
        { $group: {
          _id: { month: { $month: "$expenseDate" }, year: { $year: "$expenseDate" } },
          totalExpenses: { $sum: "$amount" },
          count: { $sum: 1 },
        }},
        { $sort: { "_id.month": 1 } },
      ]),

      // Category breakdown for the year
      Expense.aggregate([
        { $match: { status: { $ne: "Cancelled" }, expenseDate: { $gte: yearStart, $lte: yearEnd } } },
        { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),

      // Project profitability
      Project.aggregate([
        { $lookup: {
          from: "expenses",
          localField: "_id",
          foreignField: "project",
          as: "expenses",
        }},
        { $addFields: {
          projectExpenses: {
            $sum: {
              $map: {
                input: { $filter: { input: "$expenses", cond: { $ne: ["$$this.status", "Cancelled"] } } },
                in: "$$this.amount",
              },
            },
          },
        }},
        { $project: {
          projectName: 1, client: 1, status: 1, currency: 1,
          totalPrice: 1, amountReceived: 1, paymentStatus: 1,
          projectExpenses: 1,
          estimatedProfit: { $subtract: ["$totalPrice", "$projectExpenses"] },
          cashProfit: { $subtract: ["$amountReceived", "$projectExpenses"] },
        }},
        { $sort: { estimatedProfit: -1 } },
      ]),
    ]);

    // Build full 12-month array (fill gaps with 0)
    const months = Array.from({ length: 12 }, (_, i) => {
      const found = monthlyExpenses.find(m => m._id.month === i + 1);
      return {
        month: i + 1,
        monthName: new Date(yearInt, i, 1).toLocaleString("en-US", { month: "long" }),
        totalExpenses: found?.totalExpenses || 0,
        count: found?.count || 0,
      };
    });

    const totalYearExpenses = months.reduce((s, m) => s + m.totalExpenses, 0);
    const totalProjectValue = projectProfitability.reduce((s, p) => s + (p.totalPrice || 0), 0);
    const totalReceived = projectProfitability.reduce((s, p) => s + (p.amountReceived || 0), 0);

    res.status(200).json({
      success: true,
      year: yearInt,
      data: {
        monthlyExpenses: months,
        categoryBreakdown,
        projectProfitability,
        summary: {
          totalYearExpenses,
          totalProjectValue,
          totalReceived,
          netProfit: totalReceived - totalYearExpenses,
          estimatedProfit: totalProjectValue - totalYearExpenses,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
