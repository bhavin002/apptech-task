import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { UserRole } from "../src/models/common.model";
import Resource from "../src/models/resource.model";
import User from "../src/models/user.model";
import { seedAdmin } from "../src/seed";
import {
  api,
  bearer,
  closeDatabase,
  createUser,
  getResource,
  resetDatabase,
} from "./helpers";

const newResource = { name: "Room D", timezone: "Europe/Paris" };
const newRule = { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" };

describe("only admins can manage resources and availability", () => {
  let userToken: string;
  let adminToken: string;
  let roomA: Resource;

  beforeEach(async () => {
    await resetDatabase();
    roomA = await getResource("Room A");
    userToken = (await createUser()).token;

    const admin = await createUser();
    await User.update({ role: UserRole.ADMIN }, { where: { id: admin.id } });
    adminToken = admin.token;
  });

  afterAll(closeDatabase);

  it("sign-up creates a normal user", async () => {
    const response = await api().get("/api/auth/me").set(bearer(userToken)).expect(200);

    expect(response.body.data.role).toBe(UserRole.USER);
  });

  it("a normal user gets 403 for every write and can still read", async () => {
    const auth = bearer(userToken);
    const rules = `/api/resources/${roomA.id}/availability`;

    await api().post("/api/resources").set(auth).send(newResource).expect(403);
    await api().put(`/api/resources/${roomA.id}`).set(auth).send(newResource).expect(403);
    await api().delete(`/api/resources/${roomA.id}`).set(auth).expect(403);
    await api().post(rules).set(auth).send(newRule).expect(403);
    await api().put(`${rules}/1`).set(auth).send(newRule).expect(403);
    await api().delete(`${rules}/1`).set(auth).expect(403);

    await api().get("/api/resources").set(auth).expect(200);
    await api().get(rules).set(auth).expect(200);
    expect(await Resource.count({ where: { name: newResource.name } })).toBe(0);
  });

  it("an admin can create a resource and its availability", async () => {
    const auth = bearer(adminToken);

    const created = await api().post("/api/resources").set(auth).send(newResource).expect(201);
    await api()
      .post(`/api/resources/${created.body.data.id}/availability`)
      .set(auth)
      .send(newRule)
      .expect(201);
  });

  it("seedAdmin creates the admin from env, and promotes an existing account without changing its password", async () => {
    process.env.ADMIN_EMAIL = "seeded-admin@example.com";
    process.env.ADMIN_PASSWORD = "admin-password";

    await seedAdmin();
    await seedAdmin(); // idempotent
    const admins = await User.findAll({ where: { email: "seeded-admin@example.com" } });
    expect(admins).toHaveLength(1);
    expect(admins[0].role).toBe(UserRole.ADMIN);

    await api()
      .post("/api/auth/login")
      .send({ email: "seeded-admin@example.com", password: "admin-password" })
      .expect(200);

    // An existing normal user named in ADMIN_EMAIL is promoted, password untouched.
    const user = await User.findOne({ where: { role: UserRole.USER } });
    const passwordHash = user!.password;
    process.env.ADMIN_EMAIL = user!.email;
    await seedAdmin();
    await user!.reload();
    expect(user!.role).toBe(UserRole.ADMIN);
    expect(user!.password).toBe(passwordHash);
  });
});
