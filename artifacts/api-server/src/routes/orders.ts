import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const orderItemInputSchema = z.object({
  productId: z.number().optional(),
  productName: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
});

const orderInputSchema = z.object({
  whatsappNumber: z.string().min(1),
  customerName: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(orderItemInputSchema).min(1),
});

const statusUpdateSchema = z.object({
  status: z.enum(["pending", "confirmed", "delivered", "cancelled"]),
});

router.get("/orders", async (req, res): Promise<void> => {
  const { status } = req.query;
  const rows = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  const filtered = status ? rows.filter((o) => o.status === status) : rows;
  const withItems = await Promise.all(
    filtered.map(async (order) => {
      const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
      return toOrderDto(order, items);
    }),
  );
  res.json(withItems);
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = orderInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { items, ...orderData } = parsed.data;
  const total = items.reduce((sum: number, i: { quantity: number; unitPrice: number }) => sum + i.quantity * i.unitPrice, 0);
  const [order] = await db.insert(ordersTable).values({ ...orderData, total: String(total) }).returning();
  const insertedItems = await db.insert(orderItemsTable).values(
    items.map((i: { productId?: number; productName: string; quantity: number; unitPrice: number }) => ({
      orderId: order.id,
      productId: i.productId ?? null,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: String(i.unitPrice),
    })),
  ).returning();
  res.status(201).json(toOrderDto(order, insertedItems));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
  res.json(toOrderDto(order, items));
});

router.put("/orders/:id/status", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const parsed = statusUpdateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [order] = await db.update(ordersTable)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(ordersTable.id, id))
    .returning();
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
  res.json(toOrderDto(order, items));
});

function toOrderDto(
  order: typeof ordersTable.$inferSelect,
  items: (typeof orderItemsTable.$inferSelect)[],
) {
  return {
    id: order.id,
    whatsappNumber: order.whatsappNumber,
    customerName: order.customerName ?? null,
    status: order.status,
    total: parseFloat(String(order.total)),
    notes: order.notes ?? null,
    items: items.map((i) => ({
      id: i.id,
      productId: i.productId ?? null,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: parseFloat(String(i.unitPrice)),
    })),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export default router;
