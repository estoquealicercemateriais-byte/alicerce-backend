import { Router } from "express";
import { db } from "@workspace/db";
import { conversationsTable, messagesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { sendEvolutionMessage } from "../services/evolutionBot";
import { normalizeWhatsAppNumber } from "../lib/whatsappSafety";
import { logger } from "../lib/logger";
import { isAdminRequest, isManualWhatsAppSendEnabled, requireAdminRequest } from "../lib/adminSecurity";
import { getEvolutionConfig } from "../lib/evolutionConfig";

const router = Router();
type ConversationRow = typeof conversationsTable.$inferSelect;

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
  if (status) rows = rows.filter((c: ConversationRow) => c.status === status);
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

  if (!isManualWhatsAppSendEnabled()) {
    res.status(403).json({ error: "Manual WhatsApp sending is disabled" });
    return;
  }

  if (!isAdminRequest(req)) {
    res.status(401).json({ error: "Admin API key is required" });
    return;
  }

  const [convo] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id));
  if (!convo) { res.status(404).json({ error: "Not found" }); return; }

  const to = normalizeWhatsAppNumber(convo.whatsappNumber);
  if (!to) {
    res.status(400).json({ error: "Invalid WhatsApp number for this conversation" });
    return;
  }

  const evolutionConfig = getEvolutionConfig();
  if (!evolutionConfig) {
    res.status(503).json({ error: "Evolution API environment config is not configured" });
    return;
  }

  try {
    await sendEvolutionMessage(
      evolutionConfig.apiUrl,
      evolutionConfig.apiKey,
      evolutionConfig.instance,
      to,
      parsed.data.content,
    );
  } catch (err) {
    logger.warn({ err, conversationId: id }, "Manual WhatsApp send failed");
    res.status(502).json({ error: "Failed to deliver message through Evolution API" });
    return;
  }

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

  res.json(toMessageDto(msg));
});

router.put("/conversations/:id/status", requireAdminRequest, async (req, res): Promise<void> => {
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

router.put("/conversations/:id/read", requireAdminRequest, async (req, res): Promise<void> => {
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
