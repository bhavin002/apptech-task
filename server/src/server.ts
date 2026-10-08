import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db";

import AuthRouter from "./routes/auth.route";
import ResourceRouter from "./routes/resource.route";
import AvailabilityRouter from "./routes/availability.route";
import BookingRouter from "./routes/booking.route";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectDB();

// Auth Router
app.use("/api/v1/auth", AuthRouter);

// Resource Router
app.use("/api/v1/resources", ResourceRouter);

// Availability Router
app.use(
  "/api/v1/resources",
  AvailabilityRouter
);

// Booking Router
app.use("/api/v1/bookings", BookingRouter);

const PORT =
  process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(
    `Server is running on Port Number : ${PORT}`
  );
});