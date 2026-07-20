import { pool } from "@workspace/db";
import { logger } from "./logger";

export async function ensureDatabaseSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id serial PRIMARY KEY,
      whatsapp_number text NOT NULL UNIQUE,
      customer_name text,
      status text NOT NULL DEFAULT 'human',
      last_message text,
      unread_count integer NOT NULL DEFAULT 0,
      bot_step text DEFAULT 'menu',
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS messages (
      id serial PRIMARY KEY,
      conversation_id integer NOT NULL REFERENCES conversations(id),
      content text NOT NULL,
      direction text NOT NULL,
      message_type text DEFAULT 'text',
      created_at timestamp NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS products (
      id serial PRIMARY KEY,
      name text NOT NULL,
      category text NOT NULL,
      price numeric(10, 2) NOT NULL,
      unit text NOT NULL,
      description text,
      image_url text,
      is_offer boolean NOT NULL DEFAULT false,
      in_stock boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id serial PRIMARY KEY,
      whatsapp_number text NOT NULL,
      customer_name text,
      status text NOT NULL DEFAULT 'pending',
      total numeric(10, 2) NOT NULL DEFAULT 0,
      notes text,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id serial PRIMARY KEY,
      order_id integer NOT NULL REFERENCES orders(id),
      product_id integer,
      product_name text NOT NULL,
      quantity integer NOT NULL DEFAULT 1,
      unit_price numeric(10, 2) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budget_requests (
      id serial PRIMARY KEY,
      whatsapp_number text NOT NULL,
      customer_name text,
      description text NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      notes text,
      created_at timestamp NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      id serial PRIMARY KEY,
      store_name text NOT NULL DEFAULT 'Alicerce Materiais para Construcao',
      address text,
      phone text,
      whatsapp_number text,
      opening_hours text,
      evolution_api_url text,
      evolution_api_key text,
      evolution_instance text,
      bot_welcome_message text
    );

    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS customer_name text;
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'human';
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message text;
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS unread_count integer NOT NULL DEFAULT 0;
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS bot_step text DEFAULT 'menu';
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_at timestamp NOT NULL DEFAULT now();
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now();

    ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text';

    ALTER TABLE products ADD COLUMN IF NOT EXISTS description text;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url text;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS is_offer boolean NOT NULL DEFAULT false;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS in_stock boolean NOT NULL DEFAULT true;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at timestamp NOT NULL DEFAULT now();

    ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name text;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes text;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at timestamp NOT NULL DEFAULT now();
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now();

    ALTER TABLE budget_requests ADD COLUMN IF NOT EXISTS customer_name text;
    ALTER TABLE budget_requests ADD COLUMN IF NOT EXISTS notes text;
    ALTER TABLE budget_requests ADD COLUMN IF NOT EXISTS created_at timestamp NOT NULL DEFAULT now();

    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS phone text;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS whatsapp_number text;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS opening_hours text;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS evolution_api_url text;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS evolution_api_key text;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS evolution_instance text;
    ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS bot_welcome_message text;

    CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
    CREATE INDEX IF NOT EXISTS budget_requests_status_idx ON budget_requests(status);
  `);

  logger.info("Database schema is ready");
}
