import { Router } from "express";
import { handleIncomingMessage } from "../services/evolutionBot";
import { logger } from "../lib/logger";

const router = Router();

router.post("/webhook/evolution", async (req, res): Promise<void> => {
  const payload = req.body as Record<string, unknown>;

  try {
    await handleIncomingMessage(payload);
    res.status(202).json({ ok: true, received: true });
  } catch (err) {
    logger.error({ err }, "Webhook processing failed");
    res.status(202).json({ ok: true, received: true });
  }
});

export default router;
