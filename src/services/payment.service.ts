import { Request, Response } from "express";
export class PaymentService {
  private serverKey: string;
  private apiURL: string;

  constructor(serverKey: string) {
    this.serverKey = serverKey;
    this.apiURL = process.env.MIDTRANS_API_URL as string;
  }

  async createVAOrder(orderId: string, amount: number) {
    const header = {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(this.serverKey + ":").toString("base64")}`,
    };
  }
}
