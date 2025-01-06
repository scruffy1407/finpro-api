import { PrismaClient } from "@prisma/client";
import {
  sendEmailSubExpired,
  sendEmailSubsReminder,
} from "../../config/nodeMailer";
import { DataReminder } from "../../models/models";
import { formatDate } from "../../utils/dateFormatter";
import cron from "node-cron";

export class SubscritionService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async checkAndProcessSubscriptions() {
    console.log("SCHEDULER");

    try {
      const today = new Date();
      const tomorrow = new Date(today);
      const threeDaysAgo = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      threeDaysAgo.setDate(today.getDate() - 3);
      console.log(threeDaysAgo, today, tomorrow);

      const subscriptions = await this.prisma.jobHunterSubscription.findMany({
        where: {
          subscription_active: true,
          subscription_end_date: {
            gte: threeDaysAgo,
            lte: tomorrow,
          },
        },
        include: {
          jobHunter: true,
        },
      });

      console.log("LIST SUBS :", subscriptions);
      console.log("-------------------------------------");

      // Process expiring subscriptions
      for (const subscription of subscriptions) {
        const timeToExpiration = this.calculateTimeToExpiration(
          subscription.subscription_end_date as Date,
        );

        const email = subscription.jobHunter[0].email;
        const data: DataReminder = {
          name: subscription.jobHunter[0].name,
          expirePackage: formatDate(subscription.subscription_end_date as Date),
          packageName:
            subscription.subscriptionId === 2
              ? "Standard Plan"
              : "Professional Plan",
        };

        // Less than 24 hours
        if (!subscription.reminderSent) {
          await this.sendReminder(email, data);
          await this.prisma.jobHunterSubscription.update({
            where: {
              job_hunter_subscription_id:
                subscription.job_hunter_subscription_id,
            },
            data: { reminderSent: true },
          });
        }

        // Check for expired subscriptions
        if ((subscription.subscription_end_date as Date) < today) {
          console.log("Expired Subs founded");
          await this.updateExpiredSubscription(
            subscription.job_hunter_subscription_id,
          );
          await this.sendSubsExpiredEmail(email, data);
        }
      }
    } catch (error) {
      console.error("Error checking for expiring subscriptions:", error);
    }
  }

  async updateExpiredSubscription(subscriptionId: number) {
    try {
      const update = await this.prisma.jobHunterSubscription.update({
        where: {
          job_hunter_subscription_id: subscriptionId,
        },
        include: {
          jobHunter: true,
        },
        data: {
          subscriptionId: 1,
          reminderSent: false,
          subscription_start_date: null,
          subscription_end_date: null,
          subscription_active: false,
          updated_at: new Date(),
        },
      });

      await this.prisma.jobHunter.update({
        where: {
          job_hunter_id: update.jobHunter[0].job_hunter_id,
        },
        data: {
          cv_generated_count: 0,
        },
      });
      return;
    } catch (e) {
      return e;
    }
  }

  private calculateTimeToExpiration(expirationDate: Date): number {
    // Calculate the time remaining until expiration in milliseconds
    const now = new Date();
    return expirationDate.getTime() - now.getTime();
  }

  private async sendReminder(email: string, dataReminder: DataReminder) {
    try {
      console.log(`Sending reminder to email :`, email);
      const response = await sendEmailSubsReminder(email, dataReminder);
      console.log(response);
    } catch (error) {
      console.error("Error sending reminder email:", error);
    }
  }

  private async sendSubsExpiredEmail(email: string, emailData: DataReminder) {
    try {
      console.log(`Sending reminder to email :`, email);
      const response = await sendEmailSubExpired(email, emailData);
      console.log(response);
    } catch (error) {
      console.error("Error sending reminder email:", error);
    }
  }

  startReminderJob() {
    cron.schedule("* * * * *", this.checkAndProcessSubscriptions.bind(this), {
      scheduled: true,
    });
  }
}
