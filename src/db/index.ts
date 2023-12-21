import mongoose from "mongoose";
import { DB_NAME } from "../constants";

const connectDatabase = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`,
    );
    console.log("Connected to mongodb");
    console.log(`DB host: ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log("Error connecting to mongodb ->", error);
    process.exit(1);
  }
};

export default connectDatabase;
