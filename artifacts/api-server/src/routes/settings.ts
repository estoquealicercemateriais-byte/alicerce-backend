import { Router } from "express";
import { db } from "@workspace/db";
import { storeSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const settingsInputSchema = z.object({
  storeName: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  openingHours: z.string().optional(),
  evolutionApiUrl: z.string().optional(),
  evolutionApiKey: z.string().optional(),
  evolutionInstance: z.string().optional(),
  botWelcomeMessage: z.string().optional(),
});

async function ensureSettings() {
  const [existing] = await db.select().from(storeSettingsTable);
  if (!existing) {
    const [created] = await db.insert(storeSettingsTable).values({
      storeName: "Alicerce Materiais para Construção",
      openingHours: "Segunda a Sexta: 7h às 18h | Sábado: 7h às 13h",
      botWelcomeMessage:
        "Olá! Bem-vindo à Alicerce Materiais para Construção! 🏗️\n\nComo posso ajudar?\n\n1️⃣ Consultar produtos e preços\n2️⃣ Solicitar orçamento\n3️⃣ Acompanhar pedido\n4️⃣ Horário e localização\n5️⃣ Falar com atendente",
    }).returning();
    return created;
  }
  return existing;
}

router.get("/settings", async (req, res): Promise<void> => {
  const settings = await ensureSettings();
  res.json(toSettingsDto(settings));
});

router.put("/settings", async (req, res): Promise<void> => {
  const parsed = settingsInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const existing = await ensureSettings();
  const [row] = await db
    .update(storeSettingsTable)
    .set(parsed.data)
    .where(eq(storeSettingsTable.id, existing.id))
    .returning();
  res.json(toSettingsDto(row));
});

function toSettingsDto(row: typeof storeSettingsTable.$inferSelect) {
  return {
    id: row.id,
    storeName: row.storeName,
    address: row.address ?? null,
    phone: row.phone ?? null,
    whatsappNumber: row.whatsappNumber ?? null,
    openingHours: row.openingHours ?? null,
    evolutionApiUrl: row.evolutionApiUrl ?? null,
    evolutionApiKey: row.evolutionApiKey ?? null,
    evolutionInstance: row.evolutionInstance ?? null,
    botWelcomeMessage: row.botWelcomeMessage ?? null,
  };
}

export { ensureSettings };
export default router;
