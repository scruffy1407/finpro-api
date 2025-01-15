import { Request, Response } from "express";
import { CertificateService } from "../../services/Certificate/certificate.service";
import { AuthUtils } from "../../utils/auth.utils";

export class CertificateController {
  private certificateService: CertificateService;
  private authUtils: AuthUtils;

  constructor() {
    this.certificateService = new CertificateService();
    this.authUtils = new AuthUtils();
    this.getCertificateData = this.getCertificateData.bind(this);
    this.verifyCertificate = this.verifyCertificate.bind(this);
  }

  async getCertificateData(req: Request, res: Response) {
    const token = req.headers.authorization?.split(" ")[1] as string;
    const decodedToken = await this.authUtils.decodeToken(token);

    if (!decodedToken) {
      res
        .status(401)
        .send({ success: false, message: "Unauthorized. No token found." });
      return;
    }
    try {
      const userId = Number(decodedToken.user_id);
      const certificatedata =
        await this.certificateService.getCertificateData(userId);
      res.status(200).send({ success: true, certificatedata });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .send({ success: false, message: "Failed to fetch certificate data." });
    }
  }

  async verifyCertificate(req: Request, res: Response) {
    const certificateCode = req.params.certificateCode;

    try {
      const response =
        await this.certificateService.verifyCertficate(certificateCode);
      if (response.success) {
        res.status(200).send({
          status: res.statusCode,
          code: response.code as string,
          data: response.data,
        });
      } else {
        res.status(400).send({
          status: res.statusCode,
          message: "Something went wrong",
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
