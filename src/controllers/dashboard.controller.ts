import mongoose, { isValidObjectId } from "mongoose";
import { ApiError, asyncHandler } from "../utils";
import { Video, User } from "../models";
import ApiResponse from "../utils/apiResponse";

export const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
});

export const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
});
