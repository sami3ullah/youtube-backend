import mongoose, { isValidObjectId } from "mongoose";
import { ApiError, asyncHandler } from "../utils";
import { Like } from "../models";
import ApiResponse from "../utils/apiResponse";

export const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
});

export const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
});

export const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
});

export const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
});
