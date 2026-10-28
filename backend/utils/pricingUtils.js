/**
 * Server-side pricing — never trust client-supplied cost values.
 * All functions are pure so they can be unit-tested without DB.
 */

/**
 * Returns duration in fractional hours between two Date objects.
 */
export const getDurationHours = (startTime, endTime) =>
  (endTime - startTime) / (1000 * 60 * 60);

/**
 * Base rental cost = durationHours × pricePerHour.
 */
export const calculateRentalCost = (pricePerHour, startTime, endTime) => {
  const hours = getDurationHours(startTime, endTime);
  return parseFloat((hours * pricePerHour).toFixed(2));
};

/**
 * Security deposit: 10 % of total cost, clamped to [500, 5000].
 */
export const calculateSecurityDeposit = (totalCost) =>
  Math.min(Math.max(totalCost * 0.1, 500), 5000);

/**
 * Overtime rate: 1.5× normal hourly rate.
 */
export const calculateOvertimeRate = (pricePerHour) =>
  parseFloat((pricePerHour * 1.5).toFixed(2));

/**
 * One-way drop-off fee for a vehicle that supports it.
 * Returns 0 if returnStationId is absent or same as pickupStationId.
 * Throws if the vehicle does not allow one-way trips.
 */
export const getOneWayFee = (vehicle, pickupStationId, returnStationId) => {
  if (!returnStationId || returnStationId === pickupStationId.toString()) return 0;
  if (!vehicle.allowOneWayTrip) {
    throw new Error('This vehicle does not support one-way trips.');
  }
  return vehicle.oneWayDropOffFee || 500;
};

/**
 * Full cost breakdown for a booking request.
 * Returns { rentalCost, oneWayFee, totalCost, securityDeposit, overtimeRate }.
 * Throws on one-way constraint violations.
 */
export const calculateBookingCost = (vehicle, startTime, endTime, pickupStationId, returnStationId) => {
  const rentalCost = calculateRentalCost(vehicle.pricePerHour, startTime, endTime);
  const oneWayFee = getOneWayFee(vehicle, pickupStationId, returnStationId);
  const totalCost = parseFloat((rentalCost + oneWayFee).toFixed(2));
  const securityDeposit = calculateSecurityDeposit(totalCost);
  const overtimeRate = calculateOvertimeRate(vehicle.pricePerHour);
  return { rentalCost, oneWayFee, totalCost, securityDeposit, overtimeRate };
};
