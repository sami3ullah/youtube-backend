import { COOKIE_OPTIONS, isEmailValid, isUsernameValid } from "../constants";
import { ApiError, asyncHandler } from "../utils";
import { User } from "../models";
import uploadOnCloudinary from "../utils/cloudinary";
import ApiResponse from "../utils/apiResponse";
import { AuthRequestType } from "../types";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// ============== Tokens generation ===============
const generateAccessAndRefreshTokens = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    // if no token
    if (!accessToken || !refreshToken) {
      throw new ApiError(
        500,
        "Something went wrong while generating access and refresh tokens",
      );
    }
    // adding refreshing token in the user and saving it in db
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens",
    );
  }
};

// ============== Register user controller =====================
export const registerUser = asyncHandler(async (req, res) => {
  // get the data from the client
  const { fullName, email, username, password } = req.body;

  // validation
  if (!fullName || !email || !username || !password) {
    // determining which field is missing
    const errorField = !fullName
      ? "fullName"
      : !email
        ? "Email"
        : !username
          ? "Username"
          : "password";
    throw new ApiError(400, `${errorField} is required`);
  }

  // if email is not valid
  if (!isEmailValid(email)) {
    throw new ApiError(400, "Email is not valid");
  }

  if (!isUsernameValid(username)) {
    throw new ApiError(
      400,
      "Username is not valid; username should only have numbers and alphabets",
    );
  }

  // check if the user already exist: username, email
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already exist with this email or username");
  }

  // making the req object typesafe
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  // checking if avatar image is not provided
  if (!files?.avatar) {
    res.json(new ApiError(400, "Avatar image is required"));
  }

  const avatarLocalPath = files?.avatar[0]?.path;
  let coverImageLocalPath = "";

  // if cover image exist, checking below checks because coverImage is not required
  if (
    files &&
    Array.isArray(files?.coverImage) &&
    files?.coverImage?.length > 0
  ) {
    coverImageLocalPath = files?.coverImage[0]?.path;
  }

  // if avatar doesn't exist
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }
  // upload to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  // check if avatar is uploaded to cloudinary
  if (!avatar) {
    throw new ApiError(400, "Something happened while uploading avatar image");
  }

  // create user object -> to create object in DB
  const user = await User.create({
    fullName,
    avatar: avatar?.url,
    coverImage: coverImage?.url ?? "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // check if user created in DB and removing password and refreshToken from the fields
  const createdUser = await User.findOne(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // return response if everything is okay
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

// ================ Login Controller ==================
export const loginUser = asyncHandler(async (req, res) => {
  // get data from the body
  const { username, email, password } = req.body;
  // validations
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }
  // query the db through username or email
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  // check the password
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  // create access and refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );
  // removing password and refreshToken from the user
  const {
    password: userPassword,
    refreshToken: userRefreshToken,
    ...restUserObj
  } = user._doc; // mongo stores values in _doc key
  // send secure cookies to the user
  return res
    .status(200)
    .cookie("accessToken", accessToken, COOKIE_OPTIONS)
    .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
    .json(
      new ApiResponse(
        200,
        {
          user: restUserObj,
          accessToken,
          refreshToken,
        },
        "User logged in successfully",
      ),
    );
});

// ================ Logout user controller ====================
export const logoutUser = asyncHandler(async (req: AuthRequestType, res) => {
  // setting the user's refresh token to undefined
  await User.findByIdAndUpdate(
    req?.user?._id,
    {
      $unset: {
        refreshToken: 1, //this remoes the field from the document
      },
    },
    {
      new: true,
    },
  );

  return res
    .status(200)
    .clearCookie("accessToken", COOKIE_OPTIONS)
    .clearCookie("refreshToken", COOKIE_OPTIONS)
    .json(new ApiResponse(200, {}, "User logged out"));
});

// ================ refreshAccessToken ===================
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  // if token is not right
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET ?? "",
  ) as { _id: string };

  // find user with decodedToken
  const user = await User.findById(decodedToken._id);

  if (!user) {
    throw new ApiError(401, "Invalid access token");
  }

  // verify token
  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "Refresh token is expired");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, COOKIE_OPTIONS)
    .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,
          refreshToken,
        },
        "Access token refreshed",
      ),
    );
});

export const getCurrentUser = asyncHandler(
  async (req: AuthRequestType, res) => {
    return res
      .status(200)
      .json(new ApiResponse(200, req.user, "User fetched successfully"));
  },
);

export const getWatchHistory = asyncHandler(
  async (req: AuthRequestType, res) => {
    const user = await User.aggregate([
      {
        $match: {
          //NOTE: as aggregations are purely written in mongodb syntax and mongoose so we need to make the mongoId, like ObjectId(2332523t3dsf3r3) etc. If it's not mongodb purely then simple _id would have worked, because behind the scenes mongoose converts the _id into ObjectId syntax automatically
          _id: new mongoose.Types.ObjectId(req?.user?._id),
        },
      },
      // 2nd pipeline for lookup watchHistory
      {
        $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory",
          // subpipeline
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                  {
                    $project: {
                      fullName: 1,
                      username: 1,
                      email: 1,
                      avatar: 1,
                    },
                  },
                ],
              },
            },
            // refining the data, now the data is available to us as "owner" array, but we don't want it as array, because it'll not be easy for frontend app to parse
            {
              $addFields: {
                owner: {
                  // extracting the first element of array
                  // $ sign because it's a field
                  $first: "$owner",
                },
              },
            },
          ],
        },
      },
    ]);

    // returning response
    res.status(200).json(
      new ApiResponse(
        200,
        // only returning the watch history instead of full user object
        // and getting the first element from the array because lookup always returns an array and we always have 1 user
        user[0].watchHistory,
        "Watch history fetched successfully",
      ),
    );
  },
);

export const getUserChannelProfile = asyncHandler(
  async (req: AuthRequestType, res) => {
    // getting channel name, same as username
    const { username } = req.params;

    if (!username?.trim()) {
      throw new ApiError(400, "Username is required");
    }

    // aggregate pipeline
    const channel = await User.aggregate([
      // 1st pipeline: matching user through username
      {
        $match: {
          username: username?.toLocaleLowerCase(),
        },
      },
      // 2nd pipeline: getting all the subscribers of the channel
      {
        $lookup: {
          // remember the modal was Subscription, but it mongodb turns it into
          // subscriptions in the database
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      // 3rd pipeline: getting all the subscribed channels of the channels
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      // 4th pipeline: adding fields that we made above + some other fields
      {
        $addFields: {
          subscribersCount: {
            $size: "$subscribers",
          },
          subscribedChannelsCount: {
            $size: "$subscribedTo",
          },
          isSubscribed: {
            $cond: {
              // checking if the current user exist in subscribers
              // $subscribers is a field object, means we have all the properties of the modal subscriptions on it
              if: { $in: [req?.user?._id, "$subscribers.subscriber"] },
              then: true,
              else: false,
            },
          },
        },
      },
      // 5th pipeline: setting the return fields. 1 means return it
      {
        $project: {
          fullName: 1,
          username: 1,
          email: 1,
          subscribersCount: 1,
          subscribedChannelsCount: 1,
          isSubscribed: 1,
          avatar: 1,
          coverImage: 1,
          createdAt: 1,
        },
      },
    ]);

    // checking if channel exist
    if (!channel?.length) {
      throw new ApiError(404, "Channel not found");
    }

    return (
      res
        .status(200)
        // we only have 1 user, so we return first element of the array here
        .json(new ApiResponse(200, channel[0], "Channel fetched successfully"))
    );
  },
);

// ========== User updations =============
export const updateCurrentPassword = asyncHandler(
  async (req: AuthRequestType, res) => {
    const { oldPassword, newPassword } = req.body;

    // find user by id
    const user = await User.findById(req?.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid old password");
    }

    // verfication is done, so update the password
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed successfully"));
  },
);

export const updateAccountDetails = asyncHandler(
  async (req: AuthRequestType, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
      const nullField = !fullName ? "Fullname" : "Email";
      throw new ApiError(400, `${nullField} is required`);
    }

    const user = await User.findByIdAndUpdate(
      req?.user?._id,
      {
        $set: {
          fullName,
          email,
        },
      },
      { new: true },
    ).select("-password -refreshToken");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "User updated successfully"));
  },
);

export const updateUserAvatar = asyncHandler(
  async (req: AuthRequestType, res) => {
    const avatarLocalPath = req?.file?.path;

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar image is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar?.url) {
      throw new ApiError(400, "Error while uploading avatar");
    }

    const user = await User.findByIdAndUpdate(
      req?.user?._id,
      {
        $set: {
          avatar: avatar?.url,
        },
      },
      { new: true },
    ).select("-password -refreshToken");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Avatar updated successfuly"));
  },
);

export const updateUserCoverImage = asyncHandler(
  async (req: AuthRequestType, res) => {
    const coverImageLocalPath = req?.file?.path;

    if (!coverImageLocalPath) {
      throw new ApiError(400, "Cover image is required");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage?.url) {
      throw new ApiError(400, "Error while uploading cover image");
    }

    const user = await User.findByIdAndUpdate(
      req?.user?._id,
      {
        $set: {
          avatar: coverImage?.url,
        },
      },
      { new: true },
    ).select("-password -refreshToken");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Cover image updated successfuly"));
  },
);