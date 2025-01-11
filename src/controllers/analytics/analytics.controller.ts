import { Request, Response } from "express";
import { AnalyticsService } from "../../services/analytics/analytics.service";
import { AuthUtils } from "../../utils/auth.utils";

export class AnalyticsController {
  private analyticsService: AnalyticsService;
  private authUtils: AuthUtils;

  constructor() {
    this.analyticsService = new AnalyticsService();
    this.authUtils = new AuthUtils();
    this.getUserGender = this.getUserGender.bind(this);
    this.getPopularCategory = this.getPopularCategory.bind(this);
    this.getSalaryTrends = this.getSalaryTrends.bind(this);
    this.getUserAgeGroups = this.getUserAgeGroups.bind(this);
    this.getUserLocationCity = this.getUserLocationCity.bind(this);
    this.getUserLocationProvince = this.getUserLocationProvince.bind(this);
    this.getAdditionalData = this.getAdditionalData.bind(this);
  }

  async getUserGender(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(" ")[1] || "";
      const decodedToken = await this.authUtils.decodeToken(token);
      if (!decodedToken?.user_id) {
        res
          .status(400)
          .json({ success: false, message: "User ID is missing." });
        return;
      }
      const genderData = await this.analyticsService.getUserGender();
      res.status(200).json({ status: res.statusCode, data: genderData });
    } catch (error) {
      console.error("Error in getUserGender:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch user gender." });
      return;
    }
  }

  async getUserLocationProvince(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(" ")[1] || "";
      const decodedToken = await this.authUtils.decodeToken(token);
      if (!decodedToken?.user_id) {
        res
          .status(400)
          .json({ success: false, message: "User ID is missing." });
        return;
      }
      const provinceData =
        await this.analyticsService.getUserLocationProvince();
      res.status(200).json({ status: res.statusCode, data: provinceData });
    } catch (error) {
      console.error("Error in getUserLocationProvince:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user location (province).",
      });
      return;
    }
  }

  async getUserLocationCity(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(" ")[1] || "";
      const decodedToken = await this.authUtils.decodeToken(token);
      if (!decodedToken?.user_id) {
        res
          .status(400)
          .json({ success: false, message: "User ID is missing." });
        return;
      }
      const cityData = await this.analyticsService.getUserLocationCity();
      res.status(200).json({ status: res.statusCode, data: cityData });
    } catch (error) {
      console.error("Error in getUserLocationCity:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch user location (city).",
      });
      return;
    }
  }

  async getUserAgeGroups(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(" ")[1] || "";
      const decodedToken = await this.authUtils.decodeToken(token);
      if (!decodedToken?.user_id) {
        res
          .status(400)
          .json({ success: false, message: "User ID is missing." });
        return;
      }
      const ageGroupData = await this.analyticsService.getUserAgeGroups();
      res.status(200).json({ status: res.statusCode, data: ageGroupData });
    } catch (error) {
      console.error("Error in getUserAgeGroups:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch user age groups." });
      return;
    }
  }

  async getSalaryTrends(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(" ")[1] || "";
      const decodedToken = await this.authUtils.decodeToken(token);
      if (!decodedToken?.user_id) {
        res
          .status(400)
          .json({ success: false, message: "User ID is missing." });
        return;
      }
      const salaryTrendsData = await this.analyticsService.getSalaryTrends();
      res.status(200).json({ status: res.statusCode, data: salaryTrendsData });
    } catch (error) {
      console.error("Error in getSalaryTrends:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch salary trends." });
      return;
    }
  }

  async getPopularCategory(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(" ")[1] || "";
      const decodedToken = await this.authUtils.decodeToken(token);
      if (!decodedToken?.user_id) {
        res
          .status(400)
          .json({ success: false, message: "User ID is missing." });
        return;
      }
      const popularCategoryData =
        await this.analyticsService.getPopularCategory();
      res
        .status(200)
        .json({ status: res.statusCode, data: popularCategoryData });
    } catch (error) {
      console.error("Error in getPopularCategory:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch popular categories.",
      });
      return;
    }
  }

  async getAdditionalData(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(" ")[1] || "";
      const decodedToken = await this.authUtils.decodeToken(token);
      if (!decodedToken?.user_id) {
        res
          .status(400)
          .json({ success: false, message: "User ID is missing." });
        return;
      }
      const additionalData = await this.analyticsService.getAdditionalData();
      res.status(200).json({ status: res.statusCode, data: additionalData });
    } catch (error) {
      console.error("Error in getAdditionalData:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch additional data." });
    }
    return;
  }
}
