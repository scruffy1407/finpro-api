import { Request, Response } from "express";
import {
  PaymentMethod,
  PrismaClient,
  PaymentStatus,
  RoleType,
} from "@prisma/client";
import environment from "dotenv";
import axios from "axios";
import {
  generateTransactionCode,
  generateInvoiceCode,
} from "../../utils/generateUniqueCode";
import {
  createOrder,
  createPayment,
  orderItemInfo,
  orderUserInfo,
} from "../../models/models";

environment.config();

export class PaymentService {
  private serverKey: string;
  private apiURL: string;
  private prisma: PrismaClient;

  constructor() {
    this.serverKey = process.env.MIDTRANS_SERVER_KEY as string;
    this.apiURL = process.env.MIDTRANS_API_URL as string;
    this.prisma = new PrismaClient();
  }

  async createOrder(userId: number, subsId: number) {
    let uniqueCode = "";
    let isUniqueCode = false;

    try {
      const user = await this.prisma.baseUsers.findUnique({
        where: {
          user_id: userId,
        },
        include: {
          jobHunter: true,
        },
      });

      // Check user is available or not
      if (!user) {
        return {
          success: false,
          message: "User not found",
        };
      }

      // Check is the user is jobhunter
      if (user.role_type !== RoleType.jobhunter) {
        return {
          success: false,
          message: "Subscription can only create by jobhunter",
        };
      }

      // Check if the user is still have subscription or not
      const userSubscription =
        await this.prisma.jobHunterSubscription.findUnique({
          where: {
            job_hunter_subscription_id:
              user.jobHunter[0].jobHunterSubscriptionId,
          },
        });

      if (!userSubscription) {
        return {
          success: false,
          message: "Job hunter didnt have any subscription ID",
        };
      }
      if (userSubscription.subscriptionId !== 1) {
        return {
          success: false,
          message: "User already have an ongoing subscription",
        };
      }

      const subscription = await this.prisma.subscriptionTable.findUnique({
        where: {
          subscription_id: subsId,
        },
      });
      if (!subscription) {
        return {
          success: false,
          message: "Subscription not found",
        };
      }

      do {
        uniqueCode = generateTransactionCode();
        const checkCode = await this.prisma.transaction.findUnique({
          where: {
            invoice_transaction: uniqueCode,
          },
        });
        if (checkCode?.invoice_transaction === uniqueCode) {
          isUniqueCode = false;
        }
        isUniqueCode = true;
      } while (!isUniqueCode);

      console.log("UNIQUEEEE", uniqueCode);

      if (!uniqueCode) {
        return {
          success: false,
          message: "Failed to generate unique ID",
        };
      }

      // Re arrange data
      const data: createOrder = {
        amount: Number(subscription.subscription_price),
        itemInfo: {
          subscriptionId: subscription.subscription_id,
          subscriptionName: subscription.subscription_type,
        },
        userInfo: {
          name: user.jobHunter[0].name,
          email: user.email,
        },
      };

      const midTransReturn = await this.initOrderMidtrans(
        uniqueCode,
        data.amount,
        data.userInfo,
        data.itemInfo,
      );
      if (midTransReturn.success) {
        const createOrder = await this.prisma.transaction.create({
          data: {
            invoice_transaction: uniqueCode,
            jobHunterId: user.jobHunter[0].job_hunter_id,
            transaction_amount: data.amount,
            created_at: new Date(),
            subscriptionId: data.itemInfo.subscriptionId,
            transaction_status: "pending",
          },
        });
        if (!createOrder) {
          return {
            success: false,
            message: "Failed to create order",
          };
        }
        return {
          success: true,
          data: { transaction: midTransReturn.data, createOrder },
        };
      } else {
        return {
          success: false,
          message: "Failed to create order",
          detail: midTransReturn.data,
        };
      }
    } catch (e) {
      console.error(e);
      return {
        success: false,
        message: "failed to create order",
      };
    }
  }

  async cancelStatusOrder(userId: number, orderId: string) {}

  async midtransUpdateStatus(paymentData: createPayment) {
    try {
      const checkTransaction = await this.prisma.transaction.findUnique({
        where: {
          invoice_transaction: paymentData.transactionId,
        },
      });
      if (!checkTransaction) {
        return {
          success: false,
          message: "Invalid Order ID",
        };
      }

      // CREATE PAYMENT
      if (paymentData.status === 201) {
        const createPayment = await this.createPayment(
          checkTransaction.transaction_id,
          paymentData,
        );
        if (!createPayment.success) {
          return {
            success: false,
            message: "Failed to create payment",
          };
        }

        console.log("PAYMENT CREATED");
        return {
          success: true,
          message: createPayment.message,
        };
      }

      // UPDATE PAYMENT
      else {
        const updatePayment = await this.updateStatusPayment(
          checkTransaction.jobHunterId,
          checkTransaction.subscriptionId,
          checkTransaction.transaction_id,
          paymentData,
        );
        if (!updatePayment.success) {
          return {
            success: false,
            message: updatePayment.message,
          };
        }
        await this.prisma.transaction.update({
          where: {
            invoice_transaction: paymentData.transactionId,
          },
          data: {
            transaction_status: "success",
          },
        });
        console.log("PAYMENT UPDATED");
        return {
          success: true,
          message: "Update Payment",
        };
      }
    } catch (e) {
      console.error(e);
      return {
        success: false,
        message: "Failed to update order",
      };
    }
  }

  async createPayment(transactionId: number, paymentData: createPayment) {
    let uniqueCode = "";
    let isUniqueCode = false;
    do {
      uniqueCode = generateInvoiceCode();
      const checkCode = await this.prisma.transaction.findUnique({
        where: {
          invoice_transaction: uniqueCode,
        },
      });
      if (checkCode?.invoice_transaction === uniqueCode) {
        isUniqueCode = false;
      }
      isUniqueCode = true;
    } while (!isUniqueCode);

    try {
      const createPayment = await this.prisma.payment.create({
        data: {
          transactionId: transactionId,
          invoice_payment: uniqueCode,
          payment_amount: paymentData.amount,
          payment_date: new Date("01/01/1900"), // dummy
          payment_status: PaymentStatus.pending,
          payment_method: paymentData.paymentType as PaymentMethod,
          bank:
            paymentData.paymentType === PaymentMethod.bank_transfer
              ? paymentData.bank
              : null,
          created_at: new Date(),
        },
      });

      console.log("CREATE PAYMENT", createPayment);
      return {
        success: true,
        data: createPayment,
      };
    } catch (e) {
      return {
        success: false,
        message: "Failed to create payment",
      };
    }
  }

  async updateStatusPayment(
    jobHunterId: number,
    subscriptionId: number,
    transactionId: number,
    paymentData: createPayment,
  ) {
    try {
      const checkTransaction = await this.prisma.payment.findFirst({
        where: {
          transactionId: transactionId,
        },
      });

      if (!checkTransaction) {
        return {
          success: false,
          message: "No transaction with that id record in our database",
        };
      }

      await this.prisma.payment.update({
        where: {
          payment_id: checkTransaction.payment_id,
        },
        data: {
          payment_date: new Date(paymentData.paymentDate),
          payment_status: PaymentStatus.success,
          updated_at: new Date(),
        },
      });

      const updateSubscription = await this.updateSubscriptionInfo(
        jobHunterId,
        subscriptionId,
        paymentData.paymentDate,
      );

      if (!updateSubscription.success) {
        return {
          success: false,
          message: updateSubscription.message,
        };
      }

      return {
        success: true,
        message: "update status payment and subscription",
      };
    } catch (e) {
      console.error(e);
      return {
        success: false,
        message: "Failed to update payment",
      };
    }
  }

  async initOrderMidtrans(
    orderId: string,
    amount: number,
    orderUserInfo: orderUserInfo,
    orderItemInfo: orderItemInfo,
  ) {
    const base64ServerKeyCode = Buffer.from(this.serverKey + ":").toString(
      "base64",
    );

    const header = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${base64ServerKeyCode}`,
    };
    const body = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: orderUserInfo.name,
        email: orderUserInfo.email,
      },
      item_details: [
        {
          id: orderItemInfo.subscriptionId,
          price: amount,
          quantity: 1,
          name: orderItemInfo.subscriptionName,
        },
      ],
    };
    try {
      const response = await axios.post(this.apiURL, body, {
        headers: header,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (err: any) {
      console.log(err);
      return {
        success: false,
        message: err,
      };
    }
  }
  async cancelOrderMidtrans(orderId: string) {
    const base64ServerKeyCode = Buffer.from(this.serverKey + ":").toString(
      "base64",
    );
    const options = {
      method: "POST",
      url: `https://api.sandbox.midtrans.com/v2/${orderId}/cancel`,
      headers: {
        accept: "application/json",
        authorization: `Basic ${base64ServerKeyCode}`,
      },
    };

    try {
      const response = await axios.request(options);
      if (response.status === 200) {
        return { success: true, data: response.data };
      } else {
        return { success: false, message: "Failed to cancel order" };
      }
    } catch (e) {
      console.log(e);
      return { success: false, message: "Failed to cancel order" };
    }
  }

  async updateSubscriptionInfo(
    jobhunterId: number,
    subscriptionId: number,
    paymentDate: string,
  ) {
    try {
      const checkUser = await this.prisma.jobHunter.findUnique({
        where: {
          job_hunter_id: jobhunterId,
        },
      });

      if (!checkUser) {
        return {
          success: false,
          message: "User not found",
        };
      }

      const updateSubscription = await this.prisma.jobHunterSubscription.update(
        {
          where: {
            job_hunter_subscription_id: checkUser.jobHunterSubscriptionId,
          },
          data: {
            subscriptionId: subscriptionId,
            subscription_active: true,
            subscription_start_date: new Date(paymentDate),
            subscription_end_date: new Date(
              new Date(paymentDate).getTime() + 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
            ),
            updated_at: new Date(),
          },
        },
      );
      return {
        success: {
          success: true,
          updateSubscription,
        },
      };
    } catch (e) {
      return {
        success: false,
        message: "Failed to update subscripton data",
      };
    }
  }
}
