import { Request, Response } from "express";
import { SubscritionService } from "../../services/subscription/subscription.service";

export class SubscriptionController {
  private subscriptionService: SubscritionService;

  constructor() {
    this.subscriptionService = new SubscritionService();
  }

  async startReminderJob(req: Request, res: Response) {
    this.subscriptionService.startReminderJob();
    res.status(200).json({ message: "Reminder job started" });
  }
}
