import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/db-healthz", async (_req, res): Promise<void> => {
  try {
    await pool.query("select 1");
    const tables = await pool.query<{ table_name: string }>(`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in (
          'conversations',
          'messages',
          'products',
          'orders',
          'order_items',
          'budget_requests',
          'store_settings'
        )
      order by table_name
    `);

    res.json({
      status: "ok",
      tables: tables.rows.map((row) => row.table_name),
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err instanceof Error ? err.message : "Database health check failed",
    });
  }
});

export default router;
