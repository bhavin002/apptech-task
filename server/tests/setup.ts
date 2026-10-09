import dotenv from "dotenv";

dotenv.config();

process.env.DB_NAME = process.env.TEST_DB_NAME || "resource_booking_test";
process.env.JWT_SECRET ||= "test_secret";
