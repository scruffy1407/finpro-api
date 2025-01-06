import { Request, Response } from "express";
import { CertificateService } from "../../services/Certificate/certificate.service";

export class CertificateController {
  private certificateService: CertificateService;

  constructor() {
    this.certificateService = new CertificateService();
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
