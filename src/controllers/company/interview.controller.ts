import { Request, Response } from "express";
import { InterviewService } from "../../services/company/interview.service";
import { AuthUtils } from "../../utils/auth.utils";
import {
  Interview,
  InterviewEmail,
  UpdateStatusInterview,
} from "../../models/models";
import {
  resendInterviewEmail,
  sendInterviewEmail,
} from "../../config/nodeMailer";

export class InterviewController {
  private interviewService: InterviewService;
  private authUtils: AuthUtils;

  constructor() {
    this.interviewService = new InterviewService();
    this.authUtils = new AuthUtils();
  }

  async setInterviewSchedule(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);
    const data: Interview = req.body as Interview;

    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else {
      try {
        const response = await this.interviewService.setInterviewSchedule(
          decodedToken.user_id,
          data
        );
        if (response.success) {
          sendInterviewEmail(response.interviewEmail as InterviewEmail)
            .then(() => {
              res.status(201).send({
                status: res.status,
                message: "interview created and send",
                data: response.data,
              });
            })
            .catch((err) => {
              res.status(400).send({
                status: res.status,
                message: err.message,
              });
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

  async editInterviewScedule(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);
    const data: Interview = req.body as Interview;

    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else {
      try {
        const response = await this.interviewService.updateInterviewInformation(
          decodedToken.user_id,
          data
        );
        if (response.success) {
          resendInterviewEmail(response.interviewEmail as InterviewEmail)
            .then(() => {
              res.status(200).send({
                status: res.status,
                data: response.updateInterview,
                message: "interview update and send to user",
              });
            })
            .catch((err) => {
              res.status(400).send({
                status: res.status,
                message: err.message,
              });
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
  async updateStatusInterview(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token as string);
    const data: UpdateStatusInterview = req.body as UpdateStatusInterview;
    if (!decodedToken) {
      res.status(404).send("No token found.");
    } else {
      try {
        const response = await this.interviewService.updateStatusInterview(
          decodedToken?.user_id,
          data
        );
        if (response.success) {
          res.status(200).send({
            status: res.statusCode,
            message: "Success update",
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
