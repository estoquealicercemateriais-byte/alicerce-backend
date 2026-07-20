import { Router } from "express";
import { db } from "@workspace/db";
import { conversationsTable, productsTable, ordersTable, budgetRequestsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();
type ConversationRow = typeof conversationsTable.$inferSelect;

router.get("/dashboard", async (req, res): Promise<void> => {
  const [conversations, products, orders, budgets] = await Promise.all([
    db.select().from(conversationsTable),
    db.select().from(productsTable),
    db.select().from(ordersTable),
    db.select().from(budgetRequestsTable),
  ]);

  const recentConversations = await db
    .select()
    .from(conversationsTable)
    .orderBy(desc(conversationsTable.updatedAt))
    .limit(5);

  res.json({
    totalConversations: conversations.length,
    activeBot: conversations.filter((c: ConversationRow) => c.status === "bot").length,
    awaitingHuman: conversations.filter((c: ConversationRow) => c.status === "human").length,
    totalProducts: products.length,
    pendingOrders: orders.filter((o) => o.status === "pending").length,
    pendingBudgets: budgets.filter((b) => b.status === "pending").length,
    recentConversations: recentConversations.map((c: ConversationRow) => ({
      id: c.id,
      whatsappNumber: c.whatsappNumber,
      customerName: c.customerName ?? null,
      status: c.status,
      lastMessage: c.lastMessage ?? null,
      unreadCount: c.unreadCount,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  });
});

export default router;
