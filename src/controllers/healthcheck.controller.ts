import { asyncHandler, ApiError } from "../utils";
import ApiResponse from "../utils/apiResponse";

export const healthcheck = asyncHandler(async (req, res) => {
  //TODO: build a healthcheck response that simply returns the OK status as json with a message
});
