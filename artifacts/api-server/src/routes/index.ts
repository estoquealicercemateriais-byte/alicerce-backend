import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import productsRouter from "./products";
import conversationsRouter from "./conversations";
import ordersRouter from "./orders";
import budgetsRouter from "./budgets";
import settingsRouter from "./settings";
import webhookRouter from "./webhook";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(productsRouter);
router.use(conversationsRouter);
router.use(ordersRouter);
router.use(budgetsRouter);
router.use(settingsRouter);
router.use(webhookRouter);

export default router;
