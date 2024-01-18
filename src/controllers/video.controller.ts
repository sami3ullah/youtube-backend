import { ApiError, asyncHandler } from "../utils";
import { Video } from "../models";
import uploadOnCloudinary from "../utils/cloudinary";
import ApiResponse from "../utils/apiResponse";
import { AuthRequestType } from "../types";

export const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
});

export const getVideoById = asyncHandler(async (req, res) => {
  // get id from the request
  const videoId = req.params.videoId;
  console.log(videoId, "VideoId");

  // search that id in the db and get the video
  const video = await Video.findOne({
    _id: videoId,
  });

  if (!video) {
    throw new ApiError(404, "Video doesn't not exist with this ID");
  }

  // send the user the video
  res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

export const uploadVideo = asyncHandler(async (req: AuthRequestType, res) => {
  // get videoUrl, title, thumbnail & description from the body
  const { title, description } = req.body;
  // check if something is missing
  if (!title || !description) {
    const errorField = !title ? "Title" : "Description";

    throw new ApiError(400, `${errorField} is required`);
  }

  // get the video and thumbnail from multer
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  // checking if video and thumbnail exist
  if (!files?.video) {
    throw new ApiError(400, "Video is required");
  }

  if (!files?.thumbnail) {
    throw new ApiError(400, "Video thumbnail is required");
  }

  // local paths
  const videoLocalPath = files?.video[0]?.path;
  const thumbnailLocalPath = files?.thumbnail[0]?.path;

  // upload it to cloudinary
  const uploadedVideo = await uploadOnCloudinary(videoLocalPath);
  const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  // save it in db
  const video = await Video.create({
    title,
    description,
    owner: req?.user?._id,
    videoFile: uploadedVideo?.url,
    duration: uploadedVideo?.duration, //duration for the video
    thumbnail: uploadedThumbnail?.url,
  });

  // if video is not created
  if (!video) {
    throw new ApiError(500, "Something went wrong while uploading a video");
  }

  // return the response to the user
  res
    .status(200)
    .json(new ApiResponse(201, video, "Video uploaded successfully"));
});

// ============ update video thumbnail ==============
export const updateThumbnail = asyncHandler(
  async (req: AuthRequestType, res) => {
    const { videoId } = req.body;

    // getting the video
    const video = await Video.findById({ _id: videoId });

    // getting the local path from multer
    const thumbnailLocalPath = req?.file?.path;

    // if no thumbnail and videoId provided
    if (!thumbnailLocalPath || !videoId) {
      const errorField = !videoId ? "VideoId" : "Thumbnail";
      throw new ApiError(400, `${errorField} is required`);
    }

    // if video not found in DB
    if (!video) {
      throw new ApiError(404, "Cannot find the video with this videoId");
    }

    // uploading the thumbnail on cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail?.url) {
      throw new ApiError(400, "Error while uploading the thumbnail");
    }
  },
);

// ============ updating a video ==============
export const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

// ============ deleting a video ==============
export const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const deletedVideo = await Video.findOneAndDelete({
    _id: videoId,
  });

  if (!deletedVideo) {
    throw new ApiError(404, "Video with this id does not exist");
  }

  res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video deleted successfully!"));
});

// ========== Publish unpublish a video ===========
export const togglePublishStatus = asyncHandler(
  async (req: AuthRequestType, res) => {
    const { videoId } = req.params;

    // we first need to get the video from the db
    const video = await Video.findById({ _id: videoId });

    if (!video) {
      throw new ApiError(404, "Cannot find the video with this id");
    }

    // check if the user has permission to edit the video
    // have to use toString here as the id is mongoid here, like ObjectI(32432r)
    if (video?.owner?.toString() !== req?.user?.id) {
      throw new ApiError(403, "You don't have permssion to edit this video");
    }

    // update the video
    video.isPublished = !video?.isPublished;

    // save it in db
    await video.save({ validateBeforeSave: false, new: true });

    // return the response
    res
      .status(200)
      .json(new ApiResponse(200, video, "Video updated successfully"));
  },
);
