import { Router } from "express";
import auth from "../../middlewares/auth";
import { UserControllers } from "./user.controller";
import multer, { memoryStorage } from "multer";
import { uploadToS3 } from "../../constant/s3";
import { UserValidations } from "./userValidation";
const storage = memoryStorage();
const upload = multer({ storage });

const router = Router();

router.get("/all-users", auth("admin"), UserControllers.getAllUser);
router.get("/count", auth("admin"), UserControllers.getUsersCount);
router.get("/profile", auth("admin"), UserControllers.getProfile);
router.patch(
  "/update-profile",
  auth("admin"),
  upload.single("profilePicture"),
  async (req, res, next) => {
    try {
      if (req.file) {
        const profilePicture = await uploadToS3({
          file: req.file,
          fileName: `users/${Math.floor(100000 + Math.random() * 900000)}`,
        });
        if (req.body?.data) {
          req.body = UserValidations.updateAdminProfileSchema.parse({
            ...JSON.parse(req?.body?.data),
            profilePicture,
          });
        } else {
          req.body = UserValidations.updateAdminProfileSchema.parse({ profilePicture });
        }
      } else {
        req.body = UserValidations.updateAdminProfileSchema.parse(JSON.parse(req?.body?.data));
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  UserControllers.updateProfile,
);
router.get("/:slug", auth("admin"), UserControllers.getSingleUser);
router.patch("/update-user/:slug", auth("admin"), UserControllers.updateUser);
router.delete("/delete-my-account", auth("patient", "doctor"), UserControllers.deleteMyProfile);

export const UserRoutes = router;
