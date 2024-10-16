import cors from "cors";
import express, { Application, Request, Response } from "express";
import cookieParser from "cookie-parser";
import router from "./app/routes";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFoundHandler from "./app/middlewares/notFoundHandler";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import i18nextMiddleware from "i18next-http-middleware";
import { WeightServices } from "./app/modules/weight/weight.service";
import cron from "node-cron";

const app: Application = express();

// parser
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);
i18next
  .use(Backend)
  // .use(i18nextMiddleware.LanguageDetector)
  .init({
    backend: {
      loadPath: "./translation/{{lng}}/translation.json",
      // loadPath: dirname + '/translation/{{lng}}/translation.json', --> not use dirname and use (.) ->./translation
    },
    detection: {
      order: ["header"],
      caches: ["cookie"],
    },
    preload: ["en", "es"],
    fallbackLng: "en",
  });

// fire every 10 second
cron.schedule("0 * * * *", async () => {
  try {
    await WeightServices.createNotificationForWeight();
  } catch (error) {
    console.log(error);
  }
});

// fire every minute
//cron.schedule("0 * * * *", async () => {
//  await WeightServices.createNotificationForWeight();
//});

app.use(i18nextMiddleware.handle(i18next));

app.get("/", async (req: Request, res: Response) => {
  res.send({ message: "Server is Running" });
});

// routes
app.use("/api/v1", router);

// global error handler
app.use(globalErrorHandler);

// not found handler
app.use(notFoundHandler);

export default app;
