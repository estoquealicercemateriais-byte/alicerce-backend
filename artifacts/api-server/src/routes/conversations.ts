import { Router } from "express";
import { db } from "@workspace/db";
import { conversationsTable, messagesTable, storeSettingsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { sendEvolutionMessage } from "../services/evolutionBot";

const router = Router();

const statusUpdateSchema = z.object({
  status: z.enum(["bot", "human", "closed"]),
});

const messageInputSchema = z.object({
  content: z.string().min(1),
});

router.get("/conversations", async (req, res): Promise<void> => {
  const { status } = req.query;
  let rows = await db
    .select()
    .from(conversationsTable)
    .orderBy(desc(conversationsTable.updatedAt));
  if (status) rows = rows.filter((c) => c.status === status);
  res.json(rows.map(toConversationDto));
});

router.get("/conversations/:id", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const [convo] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id));
  if (!convo) { res.status(404).json({ error: "Not found" }); return; }
  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(messagesTable.createdAt);
  res.json({
    ...toConversationDto(convo),
    messages: messages.map(toMessageDto),
  });
});

router.post("/conversations/:id/send", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const parsed = messageInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [convo] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id));
  if (!convo) { res.status(404).json({ error: "Not found" }); return; }

  // Save outbound message
  const [msg] = await db.insert(messagesTable).values({
    conversationId: id,
    content: parsed.data.content,
    direction: "outbound",
    messageType: "text",
  }).returning();

  // Update last message
  await db.update(conversationsTable)
    .set({ lastMessage: parsed.data.content, updatedAt: new Date() })
    .where(eq(conversationsTable.id, id));

  // Try to send via Evolution API (non-blocking)
  const [settings] = await db.select().from(storeSettingsTable);
  if (settings?.evolutionApiUrl && settings?.evolutionApiKey && settings?.evolutionInstance) {
    sendEvolutionMessage(
      settings.evolutionApiUrl,
      settings.evolutionApiKey,
      settings.evolutionInstance,
      convo.whatsappNumber,
      parsed.data.content,
    ).catch(() => {});
  }

  res.json(toMessageDto(msg));
});

router.put("/conversations/:id/status", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const parsed = statusUpdateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db
    .update(conversationsTable)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(conversationsTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toConversationDto(row));
});

router.put("/conversations/:id/read", async (req, res): Promise<void> => {
  const id = Number(req.params["id"]);
  const [row] = await db
    .update(conversationsTable)
    .set({ unreadCount: 0, updatedAt: new Date() })
    .where(eq(conversationsTable.id, id))
    .returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toConversationDto(row));
});

function toConversationDto(row: typeof conversationsTable.$inferSelect) {
  return {
    id: row.id,
    whatsappNumber: row.whatsappNumber,
    customerName: row.customerName ?? null,
    status: row.status,
    lastMessage: row.lastMessage ?? null,
    unreadCount: row.unreadCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toMessageDto(row: typeof messagesTable.$inferSelect) {
  return {
    id: row.id,
    conversationId: row.conversationId,
    content: row.content,
    direction: row.direction,
    messageType: row.messageType ?? "text",
    createdAt: row.createdAt.toISOString(),
  };
}

export default router;
