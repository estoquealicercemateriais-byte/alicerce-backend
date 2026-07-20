import { Router } from "express";
import { handleIncomingMessage } from "../services/evolutionBot";

const router = Router();

router.post("/webhook/evolution", async (req, res): Promise<void> => {
  const payload = req.body as Record<string, unknown>;
  // Process async, respond immediately
  handleIncomingMessage(payload).catch(() => {});
  res.json({ ok: true });
});

export default router;
