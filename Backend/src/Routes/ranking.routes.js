import express from "express";
import checkToken from "../Middleware/checkToken.js";
import {
  getEmployeeRankings,
  getTopPerformers,
  getDeadlineRankings,
} from "../Controllers/ranking.controller.js";

const router = express.Router();

// Rankings are readable by any authenticated user
router.get("/rankings", checkToken, getEmployeeRankings);
router.get("/top-performers", checkToken, getTopPerformers);
router.get("/deadline-rankings", checkToken, getDeadlineRankings);

export default router;
