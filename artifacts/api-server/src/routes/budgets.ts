import { Router } from "express";
import { db } from "@workspace/db";
import { budgetRequestsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const budgetUpdateSchema = z.object({
  status: z.enum(["pending", "attended", "closed"]).optional(),
  notes: z.string().optional(),
});

router.get("/budget-requests", async (req, res): Promise<void> => {
  const { status } = req.query;
  const rows = await db.select().from(budgetRequestsTable).orderBy(desc(budgetRequestsTable.createdAt));
  const filtered = status ? rows.filter((b) => b.status === status) : rows;
  res.json(filtered.map(toBudgetDto));
});

router.put("/budget-requests/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const parsed = budgetUpdateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db
    .update(budgetRequestsTable)
    .set(parsed.data)
    .where(eq(budgetRequestsTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toBudgetDto(row));
});

function toBudgetDto(row: typeof budgetRequestsTable.$inferSelect) {
  return {
    id: row.id,
    whatsappNumber: row.whatsappNumber,
    customerName: row.customerName ?? null,
    description: row.description,
    status: row.status,
    notes: row.notes ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export default router;
