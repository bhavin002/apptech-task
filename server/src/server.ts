import "dotenv/config";

import connectDB from "./config/db";
import app from "./app";

const PORT = process.env.PORT || 8000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(
      `Server is running on Port Number : ${PORT}`
    );
  });
});
