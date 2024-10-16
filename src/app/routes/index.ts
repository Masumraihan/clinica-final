import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { PatientRoutes } from "../modules/patient/patient.route";
import { DoctorRoute } from "../modules/doctor/doctor.route";
import { UserRoutes } from "../modules/user/user.route";
import { WeightRoutes } from "../modules/weight/weight.route";
import { BloodPressureRoutes } from "../modules/bloodPressure/bloodPressure.route";
import { GlucoseRoutes } from "../modules/glucose/glucose.route";
import { HealthRecordRoutes } from "../modules/healthRecord/healthRecord.route";
import { SettingsRoutes } from "../modules/settings/settings.route";
import { ConnectionRoutes } from "../modules/connections/connection.route";
import { ChatListServices } from "../modules/chatList/chatList.service";
import { ChatListRoutes } from "../modules/chatList/chatList.route";
import { MessageRoutes } from "../modules/massage/message.route";
import { NotificationRoutes } from "../modules/notification/notification.route";

const router = Router();

const moduleRoutes = [
 { path:"/auth",
    route: AuthRoutes
},
{
    path:"/patient",
    route: PatientRoutes
},
{
    path:"/weight",
    route: WeightRoutes
},
{
    path:"/blood-pressure",
    route: BloodPressureRoutes
},
{
path:"/glucose",
route: GlucoseRoutes
},
{
    path:"/health-record",
    route: HealthRecordRoutes
},
{
    path:"/user",
    route:UserRoutes
},
{
    path:"/doctor",
    route: DoctorRoute
},
{
    path:"/connection",
    route: ConnectionRoutes
},
{
    path:"/settings",
    route: SettingsRoutes
},
{
    path:"/chat-list",
    route: ChatListRoutes
},
{
    path:"/message",
    route: MessageRoutes
},
{
    path:"/notification",
    route: NotificationRoutes
}
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
