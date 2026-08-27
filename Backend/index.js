import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from 'dotenv';
import connectDB from "./src/config/db.js";

// ✅ Set timezone for production
process.env.TZ = 'Asia/Karachi';
console.log('🕐 Timezone set to:', process.env.TZ);

// Import Models
import "./src/models/Users.js";
import "./src/models/Project.js";
import "./src/models/Setting.js";
import "./src/models/Attendance.js";
import "./src/models/ScoreDeduction.js";
import "./src/models/DailyUpdate.js";
import "./src/models/Expense.js";
import "./src/models/Notification.js";

// Import Routes
import userroutes from "./src/Routes/user.Routes.js";
import projectroutes from "./src/Routes/project.routes.js";
import attendanceroutes from "./src/Routes/attendance.routes.js";
import authRoutes from "./src/Auth/routes/auth.routes.js";
import rankingRoutes from "./src/Routes/ranking.routes.js";
import settingRoutes from "./src/Routes/setting.routes.js";
import memberRoutes from "./src/Routes/members.routes.js";
import scoreDeductionRoutes from './src/Routes/scoreDeduction.routes.js';
import dailyUpdateRoutes from './src/Routes/dailyUpdate.routes.js';
import expenseRoutes from './src/Routes/expense.routes.js';
import notificationRoutes from './src/Routes/notification.routes.js';
import notificationAdvancedRoutes from './src/Routes/notification.advanced.routes.js';

// Load environment variables
dotenv.config();

// ============================================
// EXPRESS APP
// ============================================
const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  'https://academy-task-managment-system.vercel.app',
  'https://academy-task-system.vercel.app',
  'https://academy-task-managment-system-4r59.vercel.app'
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        console.warn(`⚠️ CORS blocked: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// ============================================
// TEST ROUTE
// ============================================
app.get("/testing", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is working!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    timezone: process.env.TZ || "UTC",
  });
});

// ============================================
// API ROUTES
// ============================================
app.use("/api/settings", settingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userroutes);
app.use("/api/projects", projectroutes);
app.use("/api/attendance", attendanceroutes);
app.use("/api/ranking", rankingRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/score-deductions", scoreDeductionRoutes);
app.use("/api/daily-updates", dailyUpdateRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/notifications", notificationAdvancedRoutes);

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack || err.message);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ============================================
// IMPORT SETTINGS INITIALIZATION
// ============================================
import { initializeSettings } from "./src/Controllers/setting.controller.js";

// ============================================
// DATABASE CONNECTION
// ============================================
let dbConnected = false;

const connectToDatabase = async () => {
  if (dbConnected) return;
  
  try {
    await connectDB();
    console.log("✅ Database connected successfully");
    
    try {
      const result = await initializeSettings();
      console.log("✅ Settings initialized:", result);
    } catch (settingsError) {
      console.warn("⚠️ Settings initialization warning:", settingsError.message);
    }

    try {
      const migrationResult = await User.updateMany(
        { role: "admin" },
        { $set: { role: "teamLeader" } }
      );
      if (migrationResult.modifiedCount > 0) {
        console.log(`✅ Role migration complete: ${migrationResult.modifiedCount} admin(s) converted to teamLeader`);
      }
    } catch (migrationError) {
      console.warn("⚠️ Role migration warning:", migrationError.message);
    }
    
    dbConnected = true;
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
  }
};

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  connectToDatabase();
  
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🕐 Timezone: ${process.env.TZ || 'UTC'}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
  });
};

startServer();

// ============================================
// EXPORT FOR VERCEL
// ============================================
export default async function handler(req, res) {
  await connectToDatabase();
  return app(req, res);
}

export { app };