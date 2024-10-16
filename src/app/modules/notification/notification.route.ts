import { Router } from "express";
import auth from "../../middlewares/auth";
import { NotificationControllers } from "./notification.conroller";

const router = Router();

// router.post("/create", NotificationServices.createNotificationIntoDb);
router.get("/get-notification-list",auth("patient","doctor"), NotificationControllers.getNotification);
router.patch("/read",auth("patient","doctor"), NotificationControllers.readNotification);


export const NotificationRoutes = router