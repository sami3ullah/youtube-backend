import { asyncHandler } from "../utils";

export const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "ok",
  });
});
