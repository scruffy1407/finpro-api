import { Request, Response } from "express";
import { LocationService } from "../services/location/location.service";

export class LocationController {
  private locationService: LocationService;

  constructor() {
    this.locationService = new LocationService();
  }

  async getUserLocation(req: Request, res: Response) {
    const cityId = Number(req.params.cityId);
    console.log("CITY ID", cityId);
    try {
      const response = await this.locationService.getUserLocation(cityId);
      if (response.success) {
        res.status(200).send({
          status: res.statusCode,
          data: response.data,
        });
      } else {
        res.status(400).send({
          status: res.statusCode,
          message: res.statusMessage,
        });
      }
    } catch (e) {
      res.send(500).send({
        status: res.statusCode,
        detail: e,
      });
    }
  }

  async getAllProvince(req: Request, res: Response) {
    try {
      const response = await this.locationService.getAllProvince();

      if (response.success) {
        res.status(200).send({
          status: res.statusCode,
          data: response.data,
        });
      } else {
        res.status(400).send({
          status: res.statusCode,
          message: res.statusMessage,
        });
      }
    } catch (e) {
      res.send(500).send({
        status: res.statusCode,
        detail: e,
      });
    }
  }

  async getCityByProvince(req: Request, res: Response) {
    const provinceId = Number(req.params.provinceId);
    console.log("PROVINCE ID", provinceId);
    try {
      const response = await this.locationService.getCityByProvince(provinceId);
      if (response.success) {
        res.status(200).send({
          status: res.statusCode,
          data: response.data,
        });
      } else {
        res.status(400).send({
          status: res.statusCode,
          message: res.statusMessage,
        });
      }
    } catch (e) {
      res.send(500).send({
        status: res.statusCode,
        detail: e,
      });
    }
  }

  async searchLocation(req: Request, res: Response) {
    const searchString: string = req.query.q as string;
    try {
      const response = await this.locationService.searchLocation(
        searchString as string,
      );

      if (response.success) {
        res.status(200).send({
          status: res.statusCode,
          data: response.data,
        });
      }
    } catch (e) {
      res.send(500).send({
        status: res.statusCode,
        detail: e,
      });
    }
  }
}
