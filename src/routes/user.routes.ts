import { Router } from "express";
import {
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateCurrentPassword,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers";
import multerFileUpload from "../middlewares/multerFileUpload.middleware";
import { verifyJWT } from "../middlewares";

const userRouter = Router();

// user routes
userRouter.route("/register").post(
  // added middle to handle avatar and cover image uploads
  multerFileUpload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser,
);

userRouter.route("/login").post(loginUser);
// protected or secure routes
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/refresh-token").post(refreshAccessToken);
userRouter.route("/user-details").get(verifyJWT, getCurrentUser);
userRouter.route("/update-password").post(verifyJWT, updateCurrentPassword);
userRouter.route("/update-details").patch(verifyJWT, updateAccountDetails);
userRouter
  .route("/update-avatar")
  .patch(verifyJWT, multerFileUpload.single("avatar"), updateUserAvatar);
userRouter
  .route("/update-coverimage")
  .patch(
    verifyJWT,
    multerFileUpload.single("coverImage"),
    updateUserCoverImage,
  );

export default userRouter;
