import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const productInputSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().positive(),
  unit: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
  isOffer: z.boolean().optional().default(false),
  inStock: z.boolean().optional().default(true),
});

router.get("/products", async (req, res): Promise<void> => {
  const { category, inStock } = req.query;
  let query = db.select().from(productsTable);
  const rows = await query;
  let result = rows;
  if (category) result = result.filter((p) => p.category === category);
  if (inStock !== undefined) result = result.filter((p) => p.inStock === (inStock === "true"));
  res.json(result.map(toProductDto));
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = productInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { price, ...rest } = parsed.data;
  const [row] = await db.insert(productsTable).values({ ...rest, price: String(price) }).returning();
  res.status(201).json(toProductDto(row));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const [row] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toProductDto(row));
});

router.put("/products/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const parsed = productInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { price, ...rest } = parsed.data;
  const [row] = await db.update(productsTable).set({ ...rest, price: String(price) }).where(eq(productsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toProductDto(row));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.status(204).send();
});

function toProductDto(row: typeof productsTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: parseFloat(String(row.price)),
    unit: row.unit,
    description: row.description ?? null,
    imageUrl: row.imageUrl ?? null,
    isOffer: row.isOffer,
    inStock: row.inStock,
    createdAt: row.createdAt.toISOString(),
  };
}

export default router;
