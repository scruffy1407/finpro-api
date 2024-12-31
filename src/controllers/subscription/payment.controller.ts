import { Request, Response } from "express";
import { PaymentService } from "../../services/subscription/payment.service";
import { createOrder, createPayment } from "../../models/models";
import { AuthUtils } from "../../utils/auth.utils";

export class PaymentController {
  private paymentService: PaymentService;
  private authUtils: AuthUtils;
  constructor() {
    this.paymentService = new PaymentService();
    this.authUtils = new AuthUtils();
  }

  async createOrder(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);
    const subscriptionId = req.params.subscriptionId;

    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else {
      try {
        const response = await this.paymentService.createOrder(
          decodedToken.user_id,
          Number(subscriptionId),
        );
        if (response.success) {
          res.status(201).send({
            status: res.statusCode,
            data: response.data,
          });
        } else {
          res.status(400).send({
            status: res.statusCode,
            message: response.message,
            detail: response.detail || null,
          });
        }
      } catch (e) {
        console.error(e);
        res.status(500).send({
          status: res.statusCode,
          message: "Something went wrong",
        });
      }
    }
  }

  // async cancelOrder(req: Request, res: Response) {
  //   const token = req.headers.authorization?.split(" ")[1] as string;
  //   const decodedToken = await this.authUtils.decodeToken(token as string);
  //   const orderId = req.params.orderId;
  //
  //   if (!decodedToken) {
  //     res.status(404).send("No token found.");
  //   } else {
  //     try {
  //       const response = await this.paymentService.cancelStatusOrder(
  //         decodedToken.user_id,
  //         orderId,
  //       );
  //       if (response.success) {
  //         res.status(200).send({
  //           status: res.statusCode,
  //           data: response.data,
  //         });
  //       } else {
  //         res.status(400).send({
  //           status: res.statusCode,
  //           message: response.message,
  //         });
  //       }
  //     } catch (e) {
  //       res.status(500).send({
  //         status: res.statusCode,
  //         message: "Something went wrong,failed to cancel order",
  //       });
  //     }
  //   }
  // }

  async verifyOrderComplete(req: Request, res: Response) {
    console.log(req.body);
    const {
      status_code,
      transaction_status,
      fraud_status,
      order_id,
      payment_type,
      va_numbers,
      gross_amount,
      settlement_time,
    } = req.body;

    const data: createPayment = {
      status: Number(status_code),
      amount: gross_amount,
      paymentType: payment_type,
      bank: va_numbers ? va_numbers[0].bank : null,
      paymentDate: settlement_time,
      paymentStatus: transaction_status,
      transactionId: order_id,
    };

    console.log("UPDATE DATA", data);

    try {
      console.log("ORDER ID", order_id);
      const response = await this.paymentService.midtransUpdateStatus(data);
      if (response.success) {
        res.status(200).send({
          status: res.statusCode,
        });
        return;
      } else {
        res.status(400).send({
          status: res.statusCode,
        });
        return;
      }
    } catch (e) {
      res.status(500).send({
        status: res.statusCode,
        message: "Something went wrong",
      });
    }
  }
}
