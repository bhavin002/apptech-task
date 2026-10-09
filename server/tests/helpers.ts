import request from "supertest";

import app from "../src/app";
import { sequelize, syncDB } from "../src/config/db";
import Resource from "../src/models/resource.model";
import { seed } from "../src/seed";

export const api = () => request(app);

// Fresh schema + seeded resources for every test.
export const resetDatabase = async () => {
  await syncDB();
  await sequelize.query(
    "TRUNCATE bookings, availabilities, resources, users RESTART IDENTITY CASCADE"
  );
  await seed();
};

export const closeDatabase = () => sequelize.close();

export const getResource = async (name: string) => {
  const resource = await Resource.findOne({ where: { name } });

  if (!resource) {
    throw new Error(`Seed resource ${name} missing`);
  }

  return resource;
};

let userCounter = 0;

// Signs up through the real auth endpoint and returns the JWT.
export const createUser = async () => {
  userCounter += 1;

  const response = await api()
    .post("/api/auth/signup")
    .send({
      firstName: "Test",
      lastName: "User",
      email: `user${userCounter}-${Date.now()}@example.com`,
      password: "password123",
    })
    .expect(201);

  return {
    id: response.body.data.user.id as number,
    token: response.body.data.token as string,
  };
};

export const bearer = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const book = (
  token: string,
  resourceId: number,
  startTime: string,
  endTime: string
) =>
  api()
    .post("/api/bookings")
    .set(bearer(token))
    .send({ resourceId, startTime, endTime });
