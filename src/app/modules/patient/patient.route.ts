import { Router } from "express";
import multer, { memoryStorage } from "multer";
import { uploadToS3 } from "../../constant/s3";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { PatientController } from "./patient.controller";
import { PatientValidation } from "./patient.validation";
const storage = memoryStorage();
const upload = multer({ storage });

const router = Router();

router.get("/patient-list", auth("admin", "doctor"), PatientController.getPatients);

router.get("/profile", auth("admin", "doctor", "patient"), PatientController.getPatientProfile);

router.get("/weight/:userId", auth("admin", "doctor"), PatientController.getPatientWeight);
router.get(
  "/blood-pressure/:userId",
  auth("admin", "doctor"),
  PatientController.getPatientBloodPressure,
);
router.get("/glucose/:userId", auth("admin", "doctor"), PatientController.getPatientGlucose);
router.get(
  "/health-record/:userId",
  auth("admin", "doctor"),
  PatientController.getPatientHealthRecord,
);
router.get("/:slug", auth("admin", "doctor"), PatientController.getSinglePatient);

router.patch(
  "/update-profile",
  auth("patient"),
  upload.single("profilePicture"),
  async (req, res, next) => {
    try {
      if (req.file) {
        const profilePicture = await uploadToS3({
          file: req.file,
          fileName: `users/${Math.floor(100000 + Math.random() * 900000)}`,
        });
        if (req.body.data) {
          req.body = PatientValidation.updatePatient.parse({
            ...JSON.parse(req?.body?.data),
            profilePicture,
          });
        } else {
          req.body = PatientValidation.updatePatient.parse({ profilePicture });
        }
      } else {
        req.body = PatientValidation.updatePatient.parse(JSON.parse(req?.body?.data));
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  PatientController.updatePatientProfile,
);

router.patch(
  "/setup-alert",
  auth("patient"),
  validateRequest(PatientValidation.setupAlertValidation),
  PatientController.setupAlert,
);
router.patch(
  "/action/:slug",
  auth("admin"),
  validateRequest(PatientValidation.patientActionValidation),
  PatientController.patientActionForAdmin,
);

router.patch(
  "/update-patient-by-doctor/:patientId",
  auth("doctor"),
  validateRequest(PatientValidation.updatePatientByDoctorValidation),
  PatientController.updatePatientByDoctor,
);

router.delete("/delete-my-account", auth("patient"), PatientController.deleteMyAccount);

export const PatientRoutes = router;
