import { Router } from "express";
import multerFileUpload from "../middlewares/multerFileUpload.middleware";
import { verifyJWT } from "../middlewares";
import {
  deleteVideo,
  getVideoById,
  togglePublishStatus,
  uploadVideo,
} from "../controllers";

const videoRouter = Router();

videoRouter.route("/video/:videoId").get(getVideoById);
videoRouter.route("/upload").post(
  verifyJWT,
  multerFileUpload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  uploadVideo,
);
videoRouter.route("/video/:videoId").delete(verifyJWT, deleteVideo);
videoRouter
  .route("/video/togglepublish/:videoId")
  .put(verifyJWT, togglePublishStatus);

export default videoRouter;
