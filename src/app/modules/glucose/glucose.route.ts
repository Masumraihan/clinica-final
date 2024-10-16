import { Router } from "express";
import auth from "../../middlewares/auth";
import { GlucoseControllers } from "./glucose.controller";

const router = Router()

router.get("/get-glucoses", auth("patient"), GlucoseControllers.getGlucose);
router.get("/last-glucose", auth("patient"), GlucoseControllers.getLatestGlucoseData);
router.post("/create", auth("patient"), GlucoseControllers.createGlucose);




export const GlucoseRoutes = router