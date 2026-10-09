import { sequelize, syncDB } from "./config/db";
import { DayOfWeek } from "./models/common.model";
import Availability from "./models/availability.model";
import Resource from "./models/resource.model";

const WEEKDAYS = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
];

// Europe/London and America/New_York observe DST; Asia/Kolkata does not.
export const SEED_RESOURCES = [
  { name: "Room A", timezone: "Europe/London", startTime: "09:00", endTime: "17:00" },
  { name: "Room B", timezone: "Asia/Kolkata", startTime: "10:00", endTime: "18:00" },
  { name: "Consultant C", timezone: "America/New_York", startTime: "09:00", endTime: "16:00" },
];

// Idempotent: resources are matched by name, availability is only
export const seed = async () => {
  for (const item of SEED_RESOURCES) {
    const [resource] = await Resource.findOrCreate({
      where: { name: item.name },
      defaults: { name: item.name, timezone: item.timezone },
    });

    const existing = await Availability.count({
      where: { resourceId: resource.id },
    });

    if (existing === 0) {
      await Availability.bulkCreate(
        WEEKDAYS.map((dayOfWeek) => ({
          resourceId: resource.id,
          dayOfWeek,
          startTime: item.startTime,
          endTime: item.endTime,
        }))
      );
    }
  }
};

if (require.main === module) {
  (async () => {
    await syncDB();
    await seed();
    console.log("Seed completed.");
    await sequelize.close();
  })().catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
}
