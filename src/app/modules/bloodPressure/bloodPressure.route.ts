import { Router } from "express";
import auth from "../../middlewares/auth";
import { BloodPressureControllers } from "./bloodPressure.Controller";

const router = Router()

router.get("/get-blood-pressures", auth("patient"), BloodPressureControllers.getBloodPressures);
router.get("/last-blood-pressure", auth("patient"), BloodPressureControllers.getLatestBloodPressureData);
router.post("/create", auth("patient"), BloodPressureControllers.createBloodPressure);


export const BloodPressureRoutes = router