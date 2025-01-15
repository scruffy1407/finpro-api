import { Router } from "express";
import { SubscriptionController } from "../controllers/subscription/subscription.controller";

const router = Router();
const subscriptionController = new SubscriptionController();

router.post(
  "/start-reminder-job",
  subscriptionController.startReminderJob.bind(subscriptionController),
);

export default router;
