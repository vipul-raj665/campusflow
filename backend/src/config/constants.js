const ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  ADMIN: 'admin',
};

const RESOURCE_TYPES = {
  COMPUTER_LAB: 'computer_lab',
  SCIENCE_LAB: 'science_lab',
  SEMINAR_HALL: 'seminar_hall',
  CLASSROOM: 'classroom',
  CONFERENCE_ROOM: 'conference_room',
  EQUIPMENT: 'equipment',
};

const RESOURCE_STATUS = {
  ACTIVE: 'active',
  MAINTENANCE: 'maintenance',
  INACTIVE: 'inactive',
};

const BOOKING_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

const SLOT_STATUS = {
  HELD: 'held',
  CONFIRMED: 'confirmed',
  MAINTENANCE: 'maintenance',
};

const MAINTENANCE_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const NOTIFICATION_TYPES = {
  BOOKING_CREATED: 'booking_created',
  BOOKING_APPROVED: 'booking_approved',
  BOOKING_REJECTED: 'booking_rejected',
  BOOKING_CANCELLED: 'booking_cancelled',
  MAINTENANCE_SCHEDULED: 'maintenance_scheduled',
  MAINTENANCE_CANCELLED: 'maintenance_cancelled',
  SYSTEM: 'system',
};

const AUDIT_ACTIONS = {
  BOOKING_CREATE: 'BOOKING_CREATE',
  BOOKING_APPROVE: 'BOOKING_APPROVE',
  BOOKING_REJECT: 'BOOKING_REJECT',
  BOOKING_CANCEL: 'BOOKING_CANCEL',
  RESOURCE_CREATE: 'RESOURCE_CREATE',
  RESOURCE_UPDATE: 'RESOURCE_UPDATE',
  RESOURCE_DELETE: 'RESOURCE_DELETE',
  MAINTENANCE_CREATE: 'MAINTENANCE_CREATE',
  MAINTENANCE_CANCEL: 'MAINTENANCE_CANCEL',
  USER_ROLE_CHANGE: 'USER_ROLE_CHANGE',
  USER_STATUS_CHANGE: 'USER_STATUS_CHANGE',
};

module.exports = {
  ROLES,
  RESOURCE_TYPES,
  RESOURCE_STATUS,
  BOOKING_STATUS,
  SLOT_STATUS,
  MAINTENANCE_STATUS,
  NOTIFICATION_TYPES,
  AUDIT_ACTIONS,
};
