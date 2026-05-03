import { Router, type IRouter } from "express";
import healthRouter from "./health";
import stocksRouter from "./stocks";
import predictionsRouter from "./predictions";
import fundamentalsRouter from "./fundamentals";
import watchlistRouter from "./watchlist";
import tradesRouter from "./trades";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/stocks", stocksRouter);
router.use("/stocks", predictionsRouter);
router.use("/stocks", fundamentalsRouter);
router.use("/watchlist", watchlistRouter);
router.use("/trades", tradesRouter);
router.use("/dashboard", dashboardRouter);

export default router;
