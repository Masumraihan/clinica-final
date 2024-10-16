import { Router } from "express";
import { ConnectionController } from "./connection.controller";
import auth from "../../middlewares/auth";

const router = Router();

router.get("/connection-request", auth("doctor"), ConnectionController.getConnectionRequest);
router.get("/my-connections", auth("patient"), ConnectionController.getConnection);
router.post("/create", auth("patient"), ConnectionController.createConnection);
router.patch("/update-status/:connectionId", auth("doctor"), ConnectionController.updateConnection);
router.delete("/cancel", auth("patient"), ConnectionController.cancelConnection);

export const ConnectionRoutes = router