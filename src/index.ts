import dotenv from "dotenv";
import connectDatabase from "./db";
import app from "./app";
// =========== Configurations =================
dotenv.config();
const PORT = process.env.PORT || 8000;

// =========== Database connection ============
connectDatabase()
  .then(() => {
    // checking if there's any issue first
    app.on("error", () => {
      console.log("Cannot start the server");
    });
    // if all is okay then start the server
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}/api/v1`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
