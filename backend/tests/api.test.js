import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import User from '../src/models/User';
import Resource from '../src/models/Resource';
import Booking from '../src/models/Booking';
import ReservationSlot from '../src/models/ReservationSlot';
import { ROLES, RESOURCE_TYPES } from '../src/config/constants';

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/campusflow_test_db';

let adminToken = '';
let studentToken = '';
let studentUser = null;
let testResource = null;

beforeAll(async () => {
  // Connect to isolated test database
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(TEST_DB_URI);

  // Clean test database collections
  await Promise.all([
    User.deleteMany({}),
    Resource.deleteMany({}),
    Booking.deleteMany({}),
    ReservationSlot.deleteMany({}),
  ]);

  // Seed test admin
  const admin = await User.create({
    name: 'Test Admin',
    email: 'admin.test@campusflow.edu',
    password: 'Admin@TestPassword123',
    role: ROLES.ADMIN,
    department: 'Testing Dept',
  });

  // Seed test student
  studentUser = await User.create({
    name: 'Test Student',
    email: 'student.test@campusflow.edu',
    password: 'Student@TestPassword123',
    role: ROLES.STUDENT,
    department: 'Computer Science',
  });

  // Seed test resource
  testResource = await Resource.create({
    name: 'Test Robotics Lab',
    code: 'TEST-LAB-01',
    type: RESOURCE_TYPES.COMPUTER_LAB,
    building: 'Innovation Block',
    roomNumber: 'B-101',
    capacity: 40,
    operatingHours: { openTime: '08:00', closeTime: '20:00' },
    allowedRoles: [ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN],
    minDurationMinutes: 30,
    maxDurationMinutes: 180,
    advanceBookingDaysLimit: 14,
  });

  // Login admin to obtain token
  const adminLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin.test@campusflow.edu', password: 'Admin@TestPassword123' });
  adminToken = adminLoginRes.body.data.accessToken;

  // Login student to obtain token
  const studentLoginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'student.test@campusflow.edu', password: 'Student@TestPassword123' });
  studentToken = studentLoginRes.body.data.accessToken;
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});

describe('1. Health & Readiness Probe', () => {
  it('GET /api/v1/health should return healthy status and database info', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.database.readyState).toBe(1);
  });
});

describe('2. Authentication & Security Tests', () => {
  it('POST /api/v1/auth/signup - should register a new student account', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      name: 'Alice Johnson',
      email: 'alice.johnson@campusflow.edu',
      password: 'Alice@Password2026',
      confirmPassword: 'Alice@Password2026',
      department: 'Physics',
      role: 'student',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('alice.johnson@campusflow.edu');
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined(); // HttpOnly refresh cookie
  });

  it('POST /api/v1/auth/signup - should reject duplicate email address', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      name: 'Alice Duplicate',
      email: 'alice.johnson@campusflow.edu',
      password: 'Alice@Password2026',
      confirmPassword: 'Alice@Password2026',
      department: 'Physics',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/signup - should forbid public registration as admin', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      name: 'Malicious Admin',
      email: 'hacker@campusflow.edu',
      password: 'Hacker@Password2026',
      confirmPassword: 'Hacker@Password2026',
      department: 'IT',
      role: 'admin',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login - should fail with generic invalid credential message on wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'student.test@campusflow.edu',
      password: 'WrongPassword@123',
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Invalid email address or password/i);
  });

  it('GET /api/v1/auth/me - should reject request without authorization token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/auth/me - should return profile for authenticated user', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('student.test@campusflow.edu');
  });
});

describe('3. Resource Management & RBAC Tests', () => {
  it('GET /api/v1/resources - public should list active resources', async () => {
    const res = await request(app).get('/api/v1/resources');
    expect(res.status).toBe(200);
    expect(res.body.data.resources.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/resources - student should be forbidden (403)', async () => {
    const res = await request(app)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        name: 'Unauthorized Lab',
        code: 'UNAUTH-01',
        type: RESOURCE_TYPES.COMPUTER_LAB,
        building: 'Block C',
        roomNumber: '101',
        capacity: 20,
      });

    expect(res.status).toBe(403);
  });

  it('POST /api/v1/resources - admin should create resource successfully', async () => {
    const res = await request(app)
      .post('/api/v1/resources')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Admin Created Lab',
        code: 'ADM-LAB-01',
        type: RESOURCE_TYPES.SCIENCE_LAB,
        building: 'Science Center',
        roomNumber: 'SC-202',
        capacity: 35,
        operatingHours: { openTime: '08:00', closeTime: '18:00' },
      });

    expect(res.status).toBe(201);
    expect(res.body.data.resource.code).toBe('ADM-LAB-01');
  });

  it('GET /api/v1/resources/:id/availability - should return real-time slots', async () => {
    const res = await request(app)
      .get(`/api/v1/resources/${testResource._id}/availability?date=2026-11-10`);

    expect(res.status).toBe(200);
    expect(res.body.data.slots).toBeDefined();
    expect(res.body.data.summary.totalSlots).toBeGreaterThan(0);
  });
});

describe('4. Booking Lifecycle & Race-Safe Concurrency', () => {
  const getFutureDate = (daysAhead) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().slice(0, 10);
  };

  const targetDate = getFutureDate(3);
  let createdBookingId = '';

  it('POST /api/v1/bookings - should create a booking and hold discrete slots', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        resource: testResource._id.toString(),
        date: targetDate,
        startTime: '10:00',
        endTime: '11:30',
        purpose: 'Robotics Team Software Testing Session',
        expectedAttendees: 20,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.booking.status).toBe('pending');
    createdBookingId = res.body.data.booking._id;

    // Verify discrete slots exist in database
    const heldSlots = await ReservationSlot.find({ booking: createdBookingId });
    expect(heldSlots.length).toBe(3); // 10:00, 10:30, 11:00
  });

  it('POST /api/v1/bookings - should reject overlapping booking request with 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        resource: testResource._id.toString(),
        date: targetDate,
        startTime: '11:00',
        endTime: '12:30', // Overlaps with 11:00 slot
        purpose: 'Competing Overlapping Request',
        expectedAttendees: 15,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/conflict|already booked/i);
  });

  it('CONCURRENCY TEST: Two simultaneous overlapping booking requests must guarantee only ONE succeeds', async () => {
    const concurrentDate = getFutureDate(4);

    const req1 = request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        resource: testResource._id.toString(),
        date: concurrentDate,
        startTime: '14:00',
        endTime: '15:30',
        purpose: 'Concurrent Requester 1',
        expectedAttendees: 10,
      });

    const req2 = request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        resource: testResource._id.toString(),
        date: concurrentDate,
        startTime: '14:00',
        endTime: '15:30',
        purpose: 'Concurrent Requester 2',
        expectedAttendees: 10,
      });

    const [res1, res2] = await Promise.all([req1, req2]);

    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(201);
    expect(statuses).toContain(409); // The loser MUST be rejected with 409
  });

  it('PATCH /api/v1/bookings/:id/approve - admin approves booking and confirms slots', async () => {
    const res = await request(app)
      .patch(`/api/v1/bookings/${createdBookingId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.booking.status).toBe('approved');

    const confirmedSlots = await ReservationSlot.find({ booking: createdBookingId });
    expect(confirmedSlots.every((s) => s.status === 'confirmed')).toBe(true);
  });

  it('PATCH /api/v1/bookings/:id/cancel - student cancels booking and releases slots', async () => {
    const res = await request(app)
      .patch(`/api/v1/bookings/${createdBookingId}/cancel`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ cancellationReason: 'Project finished early' });

    expect(res.status).toBe(200);
    expect(res.body.data.booking.status).toBe('cancelled');

    // Released slots should be completely removed from ReservationSlot collection
    const remainingSlots = await ReservationSlot.find({ booking: createdBookingId });
    expect(remainingSlots.length).toBe(0);
  });
});

describe('5. Maintenance Management & User Protection', () => {
  it('POST /api/v1/maintenance - should schedule maintenance and detect/cancel conflicting bookings', async () => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    const maintDate = d.toISOString().slice(0, 10);

    // 1. Create a preliminary approved booking on testResource
    const bookRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        resource: testResource._id.toString(),
        date: maintDate,
        startTime: '09:00',
        endTime: '11:00',
        purpose: 'Pre-existing student reservation',
        expectedAttendees: 15,
      });

    expect(bookRes.status).toBe(201);
    const preBookingId = bookRes.body.data.booking._id;

    // 2. Schedule maintenance that overlaps the booking (08:00 - 12:00)
    const maintRes = await request(app)
      .post('/api/v1/maintenance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        resource: testResource._id.toString(),
        title: 'Emergency Electrical Wiring Overhaul',
        reason: 'Upgrading transformer and breaker panels.',
        startDate: maintDate,
        endDate: maintDate,
        startTime: '08:00',
        endTime: '12:00',
      });

    expect(maintRes.status).toBe(201);
    expect(maintRes.body.data.affectedBookingsCount).toBe(1);

    // Verify pre-existing booking was safely cancelled with documented reason
    const checkBooking = await Booking.findById(preBookingId);
    expect(checkBooking.status).toBe('cancelled');
    expect(checkBooking.cancellationReason).toMatch(/maintenance/i);
  });
});

describe('6. Analytics & CSV Report Exporting', () => {
  it('GET /api/v1/analytics/dashboard - admin receives complete aggregated metrics', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary.totalResources).toBeGreaterThan(0);
    expect(res.body.data.dailyTrends).toBeDefined();
    expect(res.body.data.bookingsByType).toBeDefined();
  });

  it('GET /api/v1/analytics/export/bookings - admin can export bookings CSV', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/export/bookings')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toContain('Booking Number');
  });

  it('GET /api/v1/analytics/export/bookings - student should be forbidden (403)', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/export/bookings')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });
});
