import { Router } from "express";
import { SettingsControllers } from "./settings.controller";
import auth from "../../middlewares/auth";

const router = Router();
router.get("/get-settings", SettingsControllers.getSettings);
router.post("/create", auth("admin"), SettingsControllers.createSettings);
router.patch("/update", auth("admin"), SettingsControllers.updateSettings);
export const SettingsRoutes = router