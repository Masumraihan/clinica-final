import { Router } from "express";
import auth from "../../middlewares/auth";
import { WeightControllers } from "./weight.controller";
import validateRequest from "../../middlewares/validateRequest";
import { WeightValidations } from "./weight.validation";
const router = Router();
router.get("/get-weights", auth("patient", "doctor"), WeightControllers.getWeights);
router.get("/last-weight", auth("patient", "doctor"), WeightControllers.getLatestWeightData);
router.get(
  "/calculate-difference/:id",
  auth("patient", "doctor"),
  WeightControllers.calculateWeightDifference,
);
router.get(
  "/get-difference/:id",
  auth("patient", "doctor"),
  WeightControllers.getWeeklyWeightDifference,
);
router.post(
  "/create",
  auth("patient"),
  validateRequest(WeightValidations.weightSchema),
  WeightControllers.createWeight,
);

export const WeightRoutes = router;
