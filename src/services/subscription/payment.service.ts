import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import environment from "dotenv";
import axios from "axios";
import { generateTransactionCode } from "../../utils/generateUniqueCode";
import { createOrder, orderItemInfo, orderUserInfo } from "../../models/models";

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

  // async createOrder(orderId: string, ammount: number) {
  //   snap.c;
  // }

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
      if (!user) {
        return {
          success: false,
          message: "User not found",
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

    //   1. Create unique order code
    //   2. Check if unique order code already exist in database
    //   3. loop until the code is unique
    //   4. Once is valid unique, create an API call to midtrans
    //   5. if its success, create data on database with the all the data provided
    //   6. if its failed to create midtrans, return false (abort the process order)
    //   7. one we success create data on database, return the token and redirect link
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

  async initTransaction(req: Request, res: Response) {}
}
