import { Router } from "express";
import { LocationController } from "../controllers/location.controller";

const locationController = new LocationController();
const router = Router();

router.get(
  "/location/get-province",
  locationController.getAllProvince.bind(locationController),
);
router.get(
  "/location/get-city/:provinceId",
  locationController.getCityByProvince.bind(locationController),
);
router.get(
  "/location/search-location",
  locationController.searchLocation.bind(locationController),
);

export default router;
