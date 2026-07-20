import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const storeSettingsTable = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull().default("Alicerce Materiais para Construção"),
  address: text("address"),
  phone: text("phone"),
  whatsappNumber: text("whatsapp_number"),
  openingHours: text("opening_hours"),
  evolutionApiUrl: text("evolution_api_url"),
  evolutionApiKey: text("evolution_api_key"),
  evolutionInstance: text("evolution_instance"),
  botWelcomeMessage: text("bot_welcome_message"),
});

export const insertStoreSettingsSchema = createInsertSchema(storeSettingsTable).omit({ id: true });
export type InsertStoreSettings = z.infer<typeof insertStoreSettingsSchema>;
export type StoreSettings = typeof storeSettingsTable.$inferSelect;
