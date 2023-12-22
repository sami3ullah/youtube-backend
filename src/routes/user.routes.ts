import { Router } from "express";
import { registerUser } from "../controllers";

const userRouter = Router();

// user routes
userRouter.route("/register").post(registerUser);

export default userRouter;
