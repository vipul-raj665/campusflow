const ReservationSlot = require('../models/ReservationSlot');
const Resource = require('../models/Resource');
const { generateTimeSlots, timeToMinutes } = require('../utils/timeUtils');
const { SLOT_STATUS } = require('../config/constants');

/**
 * Atomically reserve discrete slots for a booking.
 * Enforces race-safe conflict prevention via MongoDB unique compound index.
 *
 * @param {string|ObjectId} resourceId
 * @param {string} date - YYYY-MM-DD
 * @param {string} startTime - HH:mm
 * @param {string} endTime - HH:mm
 * @param {string|ObjectId} bookingId
 * @param {string} status - 'held' | 'confirmed'
 * @returns {Promise<Array>} Inserted slot documents
 */
const reserveSlots = async (resourceId, date, startTime, endTime, bookingId, status = SLOT_STATUS.HELD) => {
  const slotTimes = generateTimeSlots(startTime, endTime, 30);

  if (slotTimes.length === 0) {
    throw new Error('No valid time slots within the requested time interval');
  }

  const slotDocs = slotTimes.map((slotTime) => ({
    resource: resourceId,
    date,
    slotTime,
    booking: bookingId,
    status,
  }));

  try {
    // Attempt atomic insertion of all discrete slots.
    // ordered: true ensures that if any slot conflicts, the operation halts immediately.
    const createdSlots = await ReservationSlot.insertMany(slotDocs, { ordered: true });
    return createdSlots;
  } catch (error) {
    // E11000 is MongoDB's duplicate key error code on the unique compound index
    if (error.code === 11000 || error.message.includes('E11000 duplicate key error')) {
      // Rollback any partial inserts from this batch if any managed to land
      await ReservationSlot.deleteMany({ booking: bookingId });
      const conflictErr = new Error('Time slot conflict: One or more requested time slots are already booked or reserved.');
      conflictErr.statusCode = 409;
      conflictErr.isConflict = true;
      throw conflictErr;
    }

    // Clean up and rethrow any other unexpected error
    await ReservationSlot.deleteMany({ booking: bookingId });
    throw error;
  }
};

/**
 * Release all slots reserved by a booking
 * @param {string|ObjectId} bookingId
 */
const releaseSlots = async (bookingId) => {
  return ReservationSlot.deleteMany({ booking: bookingId });
};

/**
 * Confirm held slots (e.g., when admin approves a booking)
 * @param {string|ObjectId} bookingId
 */
const confirmSlots = async (bookingId) => {
  return ReservationSlot.updateMany(
    { booking: bookingId },
    { $set: { status: SLOT_STATUS.CONFIRMED } }
  );
};

/**
 * Block slots for resource maintenance
 * @param {string|ObjectId} resourceId
 * @param {string} date
 * @param {string} startTime
 * @param {string} endTime
 * @param {string|ObjectId} maintenanceId
 */
const blockMaintenanceSlots = async (resourceId, date, startTime, endTime, maintenanceId) => {
  const slotTimes = generateTimeSlots(startTime, endTime, 30);
  const slotDocs = slotTimes.map((slotTime) => ({
    resource: resourceId,
    date,
    slotTime,
    booking: maintenanceId, // Using maintenanceId as the referencing document
    status: SLOT_STATUS.MAINTENANCE,
  }));

  try {
    return await ReservationSlot.insertMany(slotDocs, { ordered: false });
  } catch (error) {
    // If some slots were already booked or already blocked, continue with partial insert if ordered: false
    console.warn(`[Maintenance Slots] Some slots already occupied for maintenance on ${date}: ${error.message}`);
    return [];
  }
};

/**
 * Check slot availability for a resource on a given date
 * @param {string|ObjectId} resourceId
 * @param {string} date - YYYY-MM-DD
 * @returns {Promise<Object>} Availability overview and slot list
 */
const getResourceAvailability = async (resourceId, date) => {
  const resource = await Resource.findById(resourceId);
  if (!resource) {
    const error = new Error('Resource not found');
    error.statusCode = 404;
    throw error;
  }

  const { openTime = '08:00', closeTime = '20:00' } = resource.operatingHours || {};
  const allPossibleSlots = generateTimeSlots(openTime, closeTime, 30);

  // Fetch all currently reserved or held slots for this resource & date
  const reservedSlots = await ReservationSlot.find({ resource: resourceId, date })
    .populate('booking', 'bookingNumber status user purpose')
    .lean();

  const reservedMap = new Map();
  reservedSlots.forEach((slot) => {
    reservedMap.set(slot.slotTime, {
      status: slot.status,
      bookingNumber: slot.booking?.bookingNumber,
      isAvailable: false,
    });
  });

  const slots = allPossibleSlots.map((time) => {
    const reservedInfo = reservedMap.get(time);
    if (reservedInfo) {
      return {
        time,
        status: reservedInfo.status,
        available: false,
        bookingNumber: reservedInfo.bookingNumber,
      };
    }
    return {
      time,
      status: 'available',
      available: true,
    };
  });

  const totalSlots = slots.length;
  const availableSlotsCount = slots.filter((s) => s.available).length;
  const bookedSlotsCount = totalSlots - availableSlotsCount;

  return {
    resource: {
      id: resource._id,
      name: resource.name,
      code: resource.code,
      operatingHours: resource.operatingHours,
      status: resource.status,
    },
    date,
    summary: {
      totalSlots,
      availableSlotsCount,
      bookedSlotsCount,
      utilizationPercentage: totalSlots > 0 ? Math.round((bookedSlotsCount / totalSlots) * 100) : 0,
    },
    slots,
  };
};

module.exports = {
  reserveSlots,
  releaseSlots,
  confirmSlots,
  blockMaintenanceSlots,
  getResourceAvailability,
};
