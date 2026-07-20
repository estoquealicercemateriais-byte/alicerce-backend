import { db } from "@workspace/db";
import {
  conversationsTable,
  messagesTable,
  productsTable,
  budgetRequestsTable,
  storeSettingsTable,
} from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { logger } from "../lib/logger";
import { FloodProtection, createMessageFingerprint } from "../lib/floodProtection";
import {
  isAutoReplyEnabled,
  isBotOptInMessage,
  isBotOptOutMessage,
  maxAutomatedOffersPerRequest,
  parseDirectRemoteJid,
} from "../lib/whatsappSafety";
import { assertEvolutionApiUrlAllowed, getEvolutionConfig } from "../lib/evolutionConfig";

const inboundFloodProtection = new FloodProtection({
  cooldownMs: 3_000,
  maxMessagesPerMinute: 20,
});

const outboundFloodProtection = new FloodProtection({
  cooldownMs: 10_000,
  maxMessagesPerMinute: 3,
});

export async function sendEvolutionMessage(
  apiUrl: string,
  apiKey: string,
  instance: string,
  to: string,
  text: string,
): Promise<void> {
  assertEvolutionApiUrlAllowed(apiUrl);

  const outboundFingerprint = createMessageFingerprint(to, undefined, text);
  if (!outboundFloodProtection.shouldProcess(outboundFingerprint)) {
    logger.info({ to, fingerprint: outboundFingerprint }, "Skipping outbound message due to flood protection");
    throw new Error("Outbound message blocked by flood protection");
  }

  const url = `${apiUrl.replace(/\/$/, "")}/message/sendText/${instance}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
    body: JSON.stringify({
      number: to,
      text,
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    logger.warn({ status: response.status, body, to, url }, "Failed to send Evolution message");
    throw new Error(`Evolution API error: ${response.status} ${body}`);
  }
}

export async function sendEvolutionMedia(
  apiUrl: string,
  apiKey: string,
  instance: string,
  to: string,
  mediaUrl: string,
  caption: string,
  mediaType: "image" | "video" | "document" = "image",
  fileName?: string,
): Promise<void> {
  assertEvolutionApiUrlAllowed(apiUrl);

  const outboundFingerprint = createMessageFingerprint(to, mediaUrl, caption);
  if (!outboundFloodProtection.shouldProcess(outboundFingerprint)) {
    logger.info({ to, fingerprint: outboundFingerprint }, "Skipping outbound media message due to flood protection");
    throw new Error("Outbound media message blocked by flood protection");
  }

  const url = `${apiUrl.replace(/\/$/, "")}/message/sendMedia/${instance}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
    body: JSON.stringify({
      number: to,
      mediatype: mediaType,
      media: mediaUrl,
      caption,
      fileName: fileName || "file",
    }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    logger.warn({ status: response.status, body, to, url }, "Failed to send Evolution media");
    throw new Error(`Evolution API error: ${response.status} ${body}`);
  }
}

export async function handleIncomingMessage(payload: Record<string, unknown>): Promise<void> {
  try {
    // Parse Evolution API v2 webhook payload
    const event = payload["event"] as string | undefined;
    if (event !== "messages.upsert") return;

    const data = payload["data"] as Record<string, unknown> | undefined;
    if (!data) return;

    const key = data["key"] as Record<string, unknown> | undefined;
    const message = data["message"] as Record<string, unknown> | undefined;
    const pushName = data["pushName"] as string | undefined;

    if (!key || !message) return;

    // Ignore outbound messages
    const fromMe = key["fromMe"] as boolean | undefined;
    if (fromMe) return;

    const remoteJid = key["remoteJid"] as string | undefined;
    if (!remoteJid) return;

    const parsedJid = parseDirectRemoteJid(remoteJid);
    if (!parsedJid) {
      logger.info({ remoteJid }, "Ignoring non-direct WhatsApp webhook message");
      return;
    }
    const { phoneNumber } = parsedJid;

    // Extract text content
    const conversation2 = message["conversation"] as string | undefined;
    const extendedText = message["extendedTextMessage"] as Record<string, unknown> | undefined;
    const text = conversation2 ?? (extendedText?.["text"] as string | undefined) ?? "";
    if (!text.trim()) return;

    const messageId = (message["id"] as string | undefined) ?? (key["id"] as string | undefined) ?? "";
    const inboundFingerprint = createMessageFingerprint(phoneNumber, messageId, text);
    if (!inboundFloodProtection.shouldProcess(inboundFingerprint)) {
      logger.info({ phoneNumber, fingerprint: inboundFingerprint }, "Skipping duplicate or burst inbound message");
      return;
    }

    const autoReplyEnabled = isAutoReplyEnabled();
    const explicitOptIn = isBotOptInMessage(text);

    // Get or create conversation
    let [convo] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.whatsappNumber, phoneNumber));

    if (!convo) {
      const [created] = await db
        .insert(conversationsTable)
        .values({
          whatsappNumber: phoneNumber,
          customerName: pushName ?? null,
          status: autoReplyEnabled && explicitOptIn ? "bot" : "human",
          botStep: "menu",
        })
        .returning();
      convo = created;
    } else if (pushName && !convo.customerName) {
      await db
        .update(conversationsTable)
        .set({ customerName: pushName })
        .where(eq(conversationsTable.id, convo.id));
    }

    // Save inbound message
    await db.insert(messagesTable).values({
      conversationId: convo.id,
      content: text,
      direction: "inbound",
      messageType: "text",
    });

    // Update conversation
    await db
      .update(conversationsTable)
      .set({
        lastMessage: text,
        unreadCount: (convo.unreadCount ?? 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(conversationsTable.id, convo.id));

    if (isBotOptOutMessage(text)) {
      await db
        .update(conversationsTable)
        .set({ status: "closed", botStep: "menu", updatedAt: new Date() })
        .where(eq(conversationsTable.id, convo.id));
      logger.info({ phoneNumber }, "Conversation closed by opt-out command");
      return;
    }

    if (!autoReplyEnabled) {
      logger.info({ phoneNumber }, "Automatic WhatsApp replies disabled");
      return;
    }

    if (explicitOptIn && convo.status !== "bot") {
      const [updated] = await db
        .update(conversationsTable)
        .set({ status: "bot", botStep: "menu", updatedAt: new Date() })
        .where(eq(conversationsTable.id, convo.id))
        .returning();
      if (updated) convo = updated;
    }

    // Only process bot logic if in bot mode
    if (convo.status !== "bot") return;

    // Get settings
    const [settings] = await db.select().from(storeSettingsTable);
    const evolutionConfig = getEvolutionConfig();

    if (!evolutionConfig) {
      logger.warn({ phoneNumber }, "Evolution API environment config missing; skipping outbound delivery");
      return;
    }

    const reply = await getBotReply(convo, text.trim(), settings);
    if (!reply) return;

    try {
      await sendEvolutionMessage(
        evolutionConfig.apiUrl,
        evolutionConfig.apiKey,
        evolutionConfig.instance,
        phoneNumber,
        reply,
      );
      await db.insert(messagesTable).values({
        conversationId: convo.id,
        content: reply,
        direction: "outbound",
        messageType: "text",
      });
      await db
        .update(conversationsTable)
        .set({ lastMessage: reply, updatedAt: new Date() })
        .where(eq(conversationsTable.id, convo.id));
    } catch (err) {
      logger.warn({ err, phoneNumber }, "Failed to send text reply; skipping post-reply media");
      return;
    }

    // Reload conversation so post-reply steps use the updated botStep
    const [updatedConvo] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, convo.id));
    if (!updatedConvo) return;
    convo = updatedConvo;

    // If user asked for products/offers, send active offers with images
    if (convo.botStep === "catalog" || text.trim().toLowerCase() === "1") {
      await sendActiveOffers(
        evolutionConfig.apiUrl,
        evolutionConfig.apiKey,
        evolutionConfig.instance,
        phoneNumber,
        convo.id,
      );
    }

    // If user asked about a specific product by keyword, send product info with image
    if (convo.botStep === "product_query") {
      await sendProductInfo(
        evolutionConfig.apiUrl,
        evolutionConfig.apiKey,
        evolutionConfig.instance,
        phoneNumber,
        convo.id,
        reply,
      );
    }
  } catch (err) {
    logger.error({ err }, "Error handling incoming message");
  }
}

async function sendActiveOffers(
  apiUrl: string,
  apiKey: string,
  instance: string,
  to: string,
  conversationId: number,
): Promise<void> {
  const offers = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.isOffer, true), eq(productsTable.inStock, true)))
    .orderBy(desc(productsTable.createdAt))
    .limit(maxAutomatedOffersPerRequest());

  if (offers.length === 0) return;

  for (const offer of offers) {
    const caption = `*${offer.name}*\n${offer.description ? offer.description + "\n" : ""}💰 *R$ ${parseFloat(String(offer.price)).toFixed(2)}* / ${offer.unit}\n\nDigite *menu* para voltar ou *2* para solicitar orçamento.`;

    if (offer.imageUrl) {
      try {
        await sendEvolutionMedia(apiUrl, apiKey, instance, to, offer.imageUrl, caption, "image");
        await db.insert(messagesTable).values({
          conversationId,
          content: `[Oferta] ${offer.name} - R$ ${parseFloat(String(offer.price)).toFixed(2)}`,
          direction: "outbound",
          messageType: "image",
        });
      } catch (err) {
        logger.warn({ err, offer: offer.id }, "Failed to send offer image; falling back to text");
        // Fallback to text message
        await sendEvolutionMessage(apiUrl, apiKey, instance, to, caption);
      }
    } else {
      await sendEvolutionMessage(apiUrl, apiKey, instance, to, caption);
      await db.insert(messagesTable).values({
        conversationId,
        content: `[Oferta] ${offer.name} - R$ ${parseFloat(String(offer.price)).toFixed(2)}`,
        direction: "outbound",
        messageType: "text",
      });
    }
  }
}

async function getBotReply(
  convo: typeof conversationsTable.$inferSelect,
  text: string,
  settings: typeof storeSettingsTable.$inferSelect,
): Promise<string | null> {
  const step = convo.botStep ?? "menu";
  const normalized = text.toLowerCase().trim();

  // Always allow going back to menu
  if (["menu", "0", "voltar", "inicio", "início"].includes(normalized)) {
    await db
      .update(conversationsTable)
      .set({ botStep: "menu" })
      .where(eq(conversationsTable.id, convo.id));
    return buildMenuMessage(settings);
  }

  if (step === "menu") {
    if (["1", "produtos", "catalogo", "catálogo", "preço", "preco"].includes(normalized)) {
      await db
        .update(conversationsTable)
        .set({ botStep: "catalog" })
        .where(eq(conversationsTable.id, convo.id));
      return await buildCatalogMessage();
    }
    if (["2", "orcamento", "orçamento"].includes(normalized)) {
      await db
        .update(conversationsTable)
        .set({ botStep: "budget_desc" })
        .where(eq(conversationsTable.id, convo.id));
      return "Por favor, descreva os materiais que precisa e a quantidade estimada para prepararmos seu orçamento:";
    }
    if (["3", "pedido", "acompanhar"].includes(normalized)) {
      await db
        .update(conversationsTable)
        .set({ botStep: "order_check" })
        .where(eq(conversationsTable.id, convo.id));
      return "Para acompanhar seu pedido, por favor informe o número do seu pedido:";
    }
    if (["4", "horario", "horário", "localizacao", "localização", "endereco", "endereço"].includes(normalized)) {
      await db
        .update(conversationsTable)
        .set({ botStep: "menu" })
        .where(eq(conversationsTable.id, convo.id));
      return buildStoreInfoMessage(settings);
    }
    if (["5", "atendente", "humano", "pessoa", "ajuda"].includes(normalized)) {
      await db
        .update(conversationsTable)
        .set({ botStep: "menu", status: "human" })
        .where(eq(conversationsTable.id, convo.id));
      return "Transferindo para um atendente humano. Aguarde um momento, em breve alguém irá te atender!";
    }

    // Try to match a specific product by keywords
    const productMatch = await findProductByKeywords(normalized);
    if (productMatch) {
      await db
        .update(conversationsTable)
        .set({ botStep: "product_query" })
        .where(eq(conversationsTable.id, convo.id));
      return buildProductInfoMessage(productMatch);
    }

    // Default: show menu
    return buildMenuMessage(settings);
  }

  if (step === "budget_desc") {
    // Save budget request
    await db.insert(budgetRequestsTable).values({
      whatsappNumber: convo.whatsappNumber,
      customerName: convo.customerName ?? null,
      description: text,
      status: "pending",
    });
    await db
      .update(conversationsTable)
      .set({ botStep: "menu" })
      .where(eq(conversationsTable.id, convo.id));
    return "Seu pedido de orçamento foi registrado! Nossa equipe irá entrar em contato em breve com os valores.\n\nDigite *menu* para voltar ao início.";
  }

  if (step === "order_check") {
    await db
      .update(conversationsTable)
      .set({ botStep: "menu" })
      .where(eq(conversationsTable.id, convo.id));
    return "Vou verificar seu pedido com nossa equipe. Em caso de dúvidas, também pode ligar para nós.\n\nDigite *menu* para voltar ao início.";
  }

  if (step === "catalog") {
    await db
      .update(conversationsTable)
      .set({ botStep: "menu" })
      .where(eq(conversationsTable.id, convo.id));
    return buildMenuMessage(settings);
  }

  return buildMenuMessage(settings);
}

function buildMenuMessage(settings: typeof storeSettingsTable.$inferSelect): string {
  const welcome =
    settings.botWelcomeMessage ||
    "Olá! Bem-vindo à Alicerce Materiais para Construção!\n\nComo posso ajudar?\n\n1 - Consultar produtos e preços\n2 - Solicitar orçamento\n3 - Acompanhar pedido\n4 - Horário e localização\n5 - Falar com atendente";
  return welcome;
}

async function buildCatalogMessage(): Promise<string> {
  const offers = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.isOffer, true), eq(productsTable.inStock, true)));

  if (offers.length === 0) {
    return "No momento não temos ofertas ativas. Entre em contato com nossa equipe para mais informações.\n\nDigite *menu* para voltar.";
  }

  return `*Confira nossas ofertas especiais!* 🏗️\n\nEm breve enviarei as imagens e preços dos produtos em promoção.\n\nDigite *menu* para voltar ou *2* para solicitar um orçamento.`;
}

async function findProductByKeywords(text: string): Promise<typeof productsTable.$inferSelect | null> {
  const products = await db.select().from(productsTable).where(eq(productsTable.inStock, true));
  const words = text.split(/\s+/).filter((w) => w.length > 2);

  let bestMatch: typeof productsTable.$inferSelect | null = null;
  let bestScore = 0;

  for (const product of products) {
    const nameLower = product.name.toLowerCase();
    const categoryLower = product.category.toLowerCase();
    const descriptionLower = (product.description || "").toLowerCase();

    let score = 0;
    for (const word of words) {
      const nameHas = nameLower.includes(word);
      const categoryHas = categoryLower.includes(word);
      const descriptionHas = descriptionLower.includes(word);

      if (nameHas) score += 3;
      else if (categoryHas) score += 2;
      else if (descriptionHas) score += 1;

      // Bonus for exact whole-word match in the name (e.g. "cimento" vs "fibrocimento")
      const nameWords = nameLower.split(/[^a-z0-9çãõáéíóúâêîôû]+/);
      if (nameWords.some((w) => w === word)) score += 2;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = product;
    }
  }

  return bestScore >= 3 ? bestMatch : null;
}

function buildProductInfoMessage(product: typeof productsTable.$inferSelect): string {
  const price = parseFloat(String(product.price)).toFixed(2);
  return `*${product.name}*\n${product.category}\n\n${product.description || ""}\n\n💰 *R$ ${price}* / ${product.unit}\n\nDigite *menu* para voltar ou *2* para solicitar um orçamento.`;
}

async function sendProductInfo(
  apiUrl: string,
  apiKey: string,
  instance: string,
  to: string,
  conversationId: number,
  caption: string,
): Promise<void> {
  // Parse product name from caption (first line)
  const productName = caption.split("\n")[0].replace(/^\*+|\*+$/g, "");
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.name, productName));

  if (!product) return;

  if (product.imageUrl) {
    try {
      await sendEvolutionMedia(apiUrl, apiKey, instance, to, product.imageUrl, caption, "image");
      await db.insert(messagesTable).values({
        conversationId,
        content: `[Produto] ${product.name} - R$ ${parseFloat(String(product.price)).toFixed(2)}`,
        direction: "outbound",
        messageType: "image",
      });
    } catch (err) {
      logger.warn({ err, product: product.id }, "Failed to send product image; falling back to text");
      await sendEvolutionMessage(apiUrl, apiKey, instance, to, caption);
    }
  } else {
    await sendEvolutionMessage(apiUrl, apiKey, instance, to, caption);
  }

  await db
    .update(conversationsTable)
    .set({ botStep: "menu" })
    .where(eq(conversationsTable.id, conversationId));
}

function buildStoreInfoMessage(settings: typeof storeSettingsTable.$inferSelect): string {
  const parts = ["*Informações da Loja:*"];
  if (settings.address) parts.push(`📍 *Endereço:* ${settings.address}`);
  if (settings.phone) parts.push(`📞 *Telefone:* ${settings.phone}`);
  if (settings.openingHours) parts.push(`🕐 *Horário:* ${settings.openingHours}`);
  parts.push("\nDigite *menu* para voltar ao início.");
  return parts.join("\n");
}
