import { Router } from "express";
import multerFileUpload from "../middlewares/multerFileUpload.middleware";
import { verifyJWT } from "../middlewares";
import { getVideoById } from "../controllers";

const videoRouter = Router();

videoRouter.route("/video/:videoId").get(getVideoById);

export default videoRouter;
