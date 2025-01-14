import { Router } from "express";
import { LocationController } from "../controllers/location.controller";

const locationController = new LocationController();
const router = Router();

router.get(
  "/location/get-user-location/:cityId",
  locationController.getUserLocation.bind(locationController),
);
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
router.get(
  "/get-detail-location/:cityId",
  locationController.getDetailLocation.bind(locationController),
);
// router.get(
//   "/get-detail-locations",
//   locationController.fetchingDateLocation.bind(locationController),
// );

export default router;
