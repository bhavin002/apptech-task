import User from "./user.model";
import Resource from "./resource.model";
import Availability from "./availability.model";
import Booking from "./booking.model";

User.hasMany(Booking, {
  foreignKey: "userId",
});

Booking.belongsTo(User, {
  foreignKey: "userId",
});

Resource.hasMany(Availability, {
  foreignKey: "resourceId",
});

Availability.belongsTo(Resource, {
  foreignKey: "resourceId",
});

Resource.hasMany(Booking, {
  foreignKey: "resourceId",
});

Booking.belongsTo(Resource, {
  foreignKey: "resourceId",
});

export {
  User,
  Resource,
  Availability,
  Booking,
};