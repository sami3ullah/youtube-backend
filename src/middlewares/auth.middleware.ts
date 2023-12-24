import { User } from "../models";
import { ApiError, asyncHandler } from "../utils";
import jwt from "jsonwebtoken";
import { AuthRequestType } from "../types";

interface JwtPayload {
  _id: string;
  email: string;
  username: string;
  fullName: string;
}

export const verifyJWT = asyncHandler(async (req: AuthRequestType, _, next) => {
  try {
    // getting token, either from cookies or from the authorization Bearer header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // decoding the JWT token
    const decodedTokenInfo = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET ?? "",
    ) as JwtPayload;

    // quering the database with the particular id
    const user = await User.findById(decodedTokenInfo?._id).select(
      "-password -refreshToken",
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    // if everything is fine then create an object inside of req object
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(
      401,
      (error as Error)?.message || "Invalid Access Token",
    );
  }
});
