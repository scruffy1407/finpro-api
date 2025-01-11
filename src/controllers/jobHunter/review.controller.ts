import { Request, Response } from "express";
import { ReviewService } from "../../services/jobHunter/review.service";
import { ReviewData } from "../../models/models";
import { AuthUtils } from "../../utils/auth.utils";

export class ReviewController {
  private reviewService: ReviewService;
  private authUtils: AuthUtils;

  constructor() {
    this.reviewService = new ReviewService();
    this.authUtils = new AuthUtils();
  }

  async createReview(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);
    const reviewData: ReviewData = req.body as ReviewData;

    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else {
      try {
        const response = await this.reviewService.createReview(
          decodedToken.user_id,
          reviewData
        );
        if (response.success) {
          res.status(201).send({
            status: res.statusCode,
          });
        } else {
          res.status(400).send({
            status: res.statusCode,
            message: response.message,
          });
        }
      } catch (e) {
        res.status(500).send({
          status: res.statusCode,
          message: e,
        });
      }
    }
  }
}
