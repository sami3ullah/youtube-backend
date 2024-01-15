import { ApiError, asyncHandler } from "../utils";
import { Video } from "../models";
import uploadOnCloudinary from "../utils/cloudinary";
import ApiResponse from "../utils/apiResponse";

export const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
});

export const getVideoById = asyncHandler(async (req, res) => {
  // get id from the request
  const videoId = req.params.videoId;

  // search that id in the db and get the video
  const getVideo = await Video.findOne({
    id: videoId,
  });

  // send the user the video
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        getVideo ? getVideo : {},
        "Video fetched successfully",
      ),
    );
});

export const uploadVideo = asyncHandler(async (req, res) => {
  // get videoUrl, title, thumbnail & description from the body
  const { video, title, thumbnail, description } = req.body;

  // check if something is missing
  if (!title || !thumbnail || !description) {
    const errorField = !title
      ? "Title"
      : !thumbnail
        ? "Thumbnail"
        : "Description";

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

  // upload it to cloudinary

  // get the video total video length of the video

  // save it in db

  // return the response to the user
});

// export const likeVideo = asyncHandler(async (req, res) => {

// })

export const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

export const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

export const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});
