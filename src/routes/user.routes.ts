import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
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

export default userRouter;
