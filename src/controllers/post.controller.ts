import mongoose, { isValidObjectId } from "mongoose";
import { Post } from "../models/post.model";
import { ApiError, asyncHandler } from "../utils";
import { Video } from "../models";
import ApiResponse from "../utils/apiResponse";

const createPost = asyncHandler(async (req, res) => {
  //TODO: create tweet
});

const getUserPosts = asyncHandler(async (req, res) => {
  // TODO: get user tweets
});

export const updatePost = asyncHandler(async (req, res) => {
  //TODO: update tweet
});

export const deletePost = asyncHandler(async (req, res) => {
  //TODO: delete tweet
});
