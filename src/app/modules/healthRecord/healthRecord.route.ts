import { Router } from "express";
import httpStatus from "http-status";
import multer, { memoryStorage } from "multer";
import { uploadToS3 } from "../../constant/s3";
import AppError from "../../errors/AppError";
import auth from "../../middlewares/auth";
import { HealthRecordControllers } from "./healthRecord.controller";
const storage = memoryStorage();
const upload = multer({ storage });

const router = Router();

router.get("/get-health-records", auth("patient"), HealthRecordControllers.getHealthRecord);
// router.post("/upload", auth("patient"),
// upload.single('file'),
//     async(req,res,next ) => {
//         try {
//             if (!req.file) {
//                 throw new AppError(httpStatus.BAD_REQUEST, "File is required");
//             }
//             if (req.file) {
//                 const healthRecordFile = await uploadToS3({
//                   file: req.file,
//                   fileName: `${req.file.originalname}`,
//                 });
//                 req.body = {
//                   file:  healthRecordFile
//                 }
//             } 
//         next()
//         } catch (error) {
//             next(error)
//         }
//     },
// HealthRecordControllers.uploadHealthRecord);

router.post(
  "/upload",
  auth("patient"),
  upload.array('files', 1000000), 
  async (req, res, next) => {
    try {
      if (!req.files || !req.files.length) {
        throw new AppError(httpStatus.BAD_REQUEST, "At least one file is required");
      }

      const uploadedFiles = [];
      const filePromises = (req.files as Express.Multer.File[]).map(async (file) => {
        const healthRecordFile = await uploadToS3({
          file: file,
          fileName: `${file.originalname}`,
        });
        uploadedFiles.push(healthRecordFile);
      });

      await Promise.all(filePromises);

      req.body = {
        files: uploadedFiles,
      };

      next();
    } catch (error) {
      next(error);
    }
  },
  HealthRecordControllers.uploadHealthRecord
);
export const HealthRecordRoutes = router