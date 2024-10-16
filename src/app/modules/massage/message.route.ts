import { Router } from "express";
import multer, { memoryStorage } from "multer";
import { uploadToS3 } from "../../constant/s3";
import auth from "../../middlewares/auth";
import { MessageControllers } from "./message.controller";
import { MessageValidations } from "./message.validation";
import sendResponse from "../../utils/sendResponse";
const storage = memoryStorage();
const upload = multer({ storage });

const router = Router();
router.get(
  "/my-messages/:receiverId",
  auth("doctor", "patient"),
  MessageControllers.getMessageByReceiver,
);
router.get("/:chatId", auth("doctor", "patient"), MessageControllers.getMessages);
router.post("/upload", auth("doctor", "patient"), upload.single("file"), async (req, res, next) => {
  if (req.file) {
    try {
      const file = await uploadToS3({
        file: req.file,
        fileName: `document/${Math.floor(100000 + Math.random() * 900000)}`,
      });
      sendResponse(req, res, {
        success: true,
        statusCode: 200,
        message: "File uploaded successfully",
        data: {
          file,
        },
      });
    } catch (error) {
      next(error);
    }
  }
});
router.post(
  "/create",
  auth("doctor", "patient"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (req.file) {
        const file = await uploadToS3({
          file: req.file,
          fileName: `document/${Math.floor(100000 + Math.random() * 900000)}`,
        });
        req.body = MessageValidations.createMessageSchema.parse({
          ...JSON.parse(req?.body?.data),
          file,
        });
      } else {
        req.body = MessageValidations.createMessageSchema.parse(JSON.parse(req?.body?.data));
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  MessageControllers.createMessage,
);
router.patch("/seen/:chatId", auth("doctor", "patient"), MessageControllers.seenMessage);
export const MessageRoutes = router;
