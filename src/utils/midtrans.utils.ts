import environment from "dotenv";
import axios from "axios";
import { orderItemInfo, orderUserInfo } from "../models/models";
import { PrismaClient } from "@prisma/client";

export class MidtransUtils {
  private serverKey: string;
  private apiURL: string;

  constructor() {
    this.serverKey = process.env.MIDTRANS_SERVER_KEY as string;
    this.apiURL = process.env.MIDTRANS_API_URL as string;
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
      return {
        success: false,
        message: err,
      };
    }
  }

  async verifyStatusMidtrans(orderId: string) {
    const base64ServerKeyCode = Buffer.from(this.serverKey + ":").toString(
      "base64",
    );
    const options = {
      method: "GET",
      url: `https://api.sandbox.midtrans.com/v2/${orderId}/status`,
      headers: {
        accept: "application/json",
        authorization: `Basic ${base64ServerKeyCode}`,
      },
    };

    try {
      const response = await axios.request(options);
      if (response.status === 200) {
        return {
          message: response.data.status_message,
          status_code: response.data.status_code,
          transaction_status: response.data.transaction_status || null,
          payment_date: response.data.settlement_time || null,
          order_id: response.data.order_id || null,
          payment_type: response.data.payment_type,
          payment_amount: response.data.gross_amount,
          bank: response.data.va_numbers,
        };
      } else {
        return {
          message: response.data.status_message,
          status_code: response.data.status_code,
        };
      }
    } catch (e) {
      return {
        message: "Failed to reach midtrans server",
        status_code: 500,
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
      return { success: false, message: "Failed to cancel order" };
    }
  }
}
