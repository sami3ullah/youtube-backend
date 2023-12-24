import { COOKIE_OPTIONS, isEmailValid, isUsernameValid } from "../constants";
import { ApiError, asyncHandler } from "../utils";
import { User } from "../models";
import uploadOnCloudinary from "../utils/cloudinary";
import ApiResponse from "../utils/apiResponse";
import { AuthRequestType } from "../types";
import jwt from "jsonwebtoken";

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

  // if cover image exist
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
      $set: {
        refreshToken: undefined,
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
