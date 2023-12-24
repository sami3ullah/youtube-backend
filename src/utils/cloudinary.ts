import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath: string) => {
  try {
    if (!localFilePath) return null;
    // upload file on cloudianry
    const file = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      use_filename: true,
    });
    fs.unlinkSync(localFilePath);
    return file;
  } catch (error) {
    // if uploading failed then remove the local temporary file as well
    fs.unlinkSync(localFilePath);
    console.log("couldn't upload file to cloudinary -> ", error);
    return null;
  }
};

export default uploadOnCloudinary;
