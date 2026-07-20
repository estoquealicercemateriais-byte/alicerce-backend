import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const budgetRequestsTable = pgTable("budget_requests", {
  id: serial("id").primaryKey(),
  whatsappNumber: text("whatsapp_number").notNull(),
  customerName: text("customer_name"),
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"), // pending | attended | closed
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBudgetRequestSchema = createInsertSchema(budgetRequestsTable).omit({ id: true, createdAt: true });
export type InsertBudgetRequest = z.infer<typeof insertBudgetRequestSchema>;
export type BudgetRequest = typeof budgetRequestsTable.$inferSelect;
