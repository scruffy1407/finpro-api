import { Request, Response } from "express";
import { PaymentService } from "../../services/subscription/payment.service";
import { createOrder } from "../../models/models";
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
    const orderData: createOrder = req.body;

    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else {
      try {
        const response = await this.paymentService.createOrder(
          decodedToken.user_id,
          Number(subscriptionId),
        );
        if (response.success) {
          res.status(200).send({
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

  async verifyOrder(req: Request, res: Response) {
    console.log(req);
  }
}
