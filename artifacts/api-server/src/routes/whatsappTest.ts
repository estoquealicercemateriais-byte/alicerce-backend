import { Router } from "express";
import { db } from "@workspace/db";
import { conversationsTable, messagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { isAdminRequest } from "../lib/adminSecurity";
import { logger } from "../lib/logger";
import { normalizeWhatsAppNumber } from "../lib/whatsappSafety";
import {
  isAllowedWhatsAppTestNumber,
  isWhatsAppTestModeEnabled,
} from "../lib/whatsappTestSafety";
import { getEvolutionConfig } from "../lib/evolutionConfig";
import { sendEvolutionMessage } from "../services/evolutionBot";

const router = Router();

const testMessageSchema = z.object({
  to: z.string().min(10),
  message: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .default("Teste do WhatsBot: se voce recebeu esta mensagem, o envio pela Evolution API esta funcionando."),
});

router.post("/test/whatsapp/send", async (req, res): Promise<void> => {
  if (!isWhatsAppTestModeEnabled()) {
    res.status(403).json({ error: "WhatsApp test mode is disabled" });
    return;
  }

  if (!isAdminRequest(req)) {
    res.status(401).json({ error: "Admin API key is required" });
    return;
  }

  const parsed = testMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const to = normalizeWhatsAppNumber(parsed.data.to);
  if (!to) {
    res.status(400).json({ error: "Invalid WhatsApp test number" });
    return;
  }

  if (!isAllowedWhatsAppTestNumber(to)) {
    res.status(403).json({ error: "WhatsApp test number is not allowlisted" });
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
      parsed.data.message,
    );

    let [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.whatsappNumber, to));

    if (!conversation) {
      const [created] = await db
        .insert(conversationsTable)
        .values({
          whatsappNumber: to,
          customerName: "Contato de teste",
          status: "human",
          botStep: "menu",
          lastMessage: parsed.data.message,
        })
        .returning();
      conversation = created;
    } else {
      await db
        .update(conversationsTable)
        .set({ lastMessage: parsed.data.message, updatedAt: new Date() })
        .where(eq(conversationsTable.id, conversation.id));
    }

    await db.insert(messagesTable).values({
      conversationId: conversation.id,
      content: parsed.data.message,
      direction: "outbound",
      messageType: "text",
    });

    res.json({
      ok: true,
      to,
      conversationId: conversation.id,
      message: "WhatsApp test message sent",
    });
  } catch (err) {
    logger.warn({ err, to }, "WhatsApp test send failed");
    res.status(502).json({
      error: "Failed to send WhatsApp test message",
      detail: err instanceof Error ? err.message : undefined,
    });
  }
});

export default router;
