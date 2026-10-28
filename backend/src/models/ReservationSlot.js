const mongoose = require('mongoose');
const { SLOT_STATUS } = require('../config/constants');

const reservationSlotSchema = new mongoose.Schema(
  {
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    slotTime: {
      type: String, // HH:mm (e.g., '09:00', '09:30')
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(SLOT_STATUS),
      default: SLOT_STATUS.HELD,
    },
  },
  {
    timestamps: true,
  }
);

// CRITICAL: Compound unique index preventing concurrent double-booking of any slot
reservationSlotSchema.index({ resource: 1, date: 1, slotTime: 1 }, { unique: true });

const ReservationSlot = mongoose.models.ReservationSlot || mongoose.model('ReservationSlot', reservationSlotSchema);
module.exports = ReservationSlot;
