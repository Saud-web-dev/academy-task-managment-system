import express from "express";
import { getTopPerformer, getAllEmployeesRanking } from "../Controllers/employRanking.controller";

const router = express.Router();

// Dashboard ke liye top performer
router.get("/top-performer", getTopPerformer);

// All employees ranking with pagination
router.get("/rankings", getAllEmployeesRanking);

export default router;