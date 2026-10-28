const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Booking = require('../models/Booking');
const ReservationSlot = require('../models/ReservationSlot');
const Notification = require('../models/Notification');
const { reserveSlots } = require('../services/slotService');
const { ROLES, RESOURCE_TYPES, RESOURCE_STATUS, BOOKING_STATUS, NOTIFICATION_TYPES } = require('../config/constants');
const { createDateTime } = require('./timeUtils');

const sampleResources = [
  {
    name: 'Alan Turing Advanced Computing Lab',
    code: 'LAB-CS-101',
    type: RESOURCE_TYPES.COMPUTER_LAB,
    building: 'Turing Technology Complex',
    roomNumber: 'Room 101',
    capacity: 60,
    amenities: ['Gigabit Fiber LAN', '60x High-End Dell Workstations (RTX 4080)', 'Dual 4K Projectors', 'Central Air Conditioning', 'Surround Sound Audio'],
    operatingHours: { openTime: '08:00', closeTime: '20:00' },
    allowedRoles: [ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN],
    minDurationMinutes: 30,
    maxDurationMinutes: 240,
    advanceBookingDaysLimit: 14,
    status: RESOURCE_STATUS.ACTIVE,
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    description: 'Premier computing facility equipped for distributed systems, artificial intelligence research, and high-performance programming practicals.',
  },
  {
    name: 'Ada Lovelace AI & Robotics Laboratory',
    code: 'LAB-AI-204',
    type: RESOURCE_TYPES.COMPUTER_LAB,
    building: 'Turing Technology Complex',
    roomNumber: 'Room 204',
    capacity: 45,
    amenities: ['Tensor Core GPU Clusters', 'Robotic Manipulators', 'Smart Sensor Array', 'Interactive Touch Displays'],
    operatingHours: { openTime: '08:30', closeTime: '21:00' },
    allowedRoles: [ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN],
    minDurationMinutes: 60,
    maxDurationMinutes: 300,
    advanceBookingDaysLimit: 21,
    status: RESOURCE_STATUS.ACTIVE,
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
    description: 'Specialized lab designed for deep learning experiments, robotics kinematics simulation, and computer vision workshops.',
  },
  {
    name: 'Quantum Optics & Condensed Matter Lab',
    code: 'LAB-PHYS-301',
    type: RESOURCE_TYPES.SCIENCE_LAB,
    building: 'Rutherford Science Center',
    roomNumber: 'Room 301',
    capacity: 30,
    amenities: ['Optical Isolation Tables', 'Spectrophotometers', 'Helium-Neon Lasers', 'Cryogenic Chambers', 'Fume Hoods'],
    operatingHours: { openTime: '09:00', closeTime: '18:00' },
    allowedRoles: [ROLES.FACULTY, ROLES.ADMIN],
    minDurationMinutes: 60,
    maxDurationMinutes: 360,
    advanceBookingDaysLimit: 30,
    status: RESOURCE_STATUS.ACTIVE,
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
    description: 'Advanced postgraduate physics facility designated for optical spectroscopy and quantum mechanical phenomena investigations.',
  },
  {
    name: 'APJ Abdul Kalam Grand Auditorium',
    code: 'AUD-CENTRAL-01',
    type: RESOURCE_TYPES.SEMINAR_HALL,
    building: 'Central Administration Block',
    roomNumber: 'Ground Floor Wing B',
    capacity: 450,
    amenities: ['Line Array Acoustic PA System', 'Dual 300-inch Laser Cinema Screens', 'Podium with Touch Teleprompter', 'Stage Lighting Rig', 'Live Streaming Console'],
    operatingHours: { openTime: '08:00', closeTime: '22:00' },
    allowedRoles: [ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN],
    minDurationMinutes: 60,
    maxDurationMinutes: 480,
    advanceBookingDaysLimit: 60,
    status: RESOURCE_STATUS.ACTIVE,
    imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    description: 'Premier campus auditorium for university symposiums, international conferences, cultural galas, and guest lectures.',
  },
  {
    name: 'Ramanujan Mathematical Seminar Hall',
    code: 'SEM-MATH-102',
    type: RESOURCE_TYPES.SEMINAR_HALL,
    building: 'Aryabhata Academic Wing',
    roomNumber: 'Room 102',
    capacity: 120,
    amenities: ['Full-Wall Magnetic Glass Whiteboards', 'HD Ceiling Projector', 'Lapel Microphones', 'Tiered Ergonomic Seating'],
    operatingHours: { openTime: '08:00', closeTime: '19:00' },
    allowedRoles: [ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN],
    minDurationMinutes: 30,
    maxDurationMinutes: 180,
    advanceBookingDaysLimit: 14,
    status: RESOURCE_STATUS.ACTIVE,
    imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
    description: 'Medium seminar hall tailored for departmental guest lectures, research defenses, and student organization events.',
  },
  {
    name: 'Smart Collaborative Classroom 204',
    code: 'CLS-ENG-204',
    type: RESOURCE_TYPES.CLASSROOM,
    building: 'Engineering Block A',
    roomNumber: 'Room 204',
    capacity: 75,
    amenities: ['Interactive 86-inch Smart Board', 'Hybrid Distance Learning Cam', 'Reconfigurable Pod Desks', 'High-Speed Wi-Fi 6'],
    operatingHours: { openTime: '08:00', closeTime: '18:00' },
    allowedRoles: [ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN],
    minDurationMinutes: 30,
    maxDurationMinutes: 120,
    advanceBookingDaysLimit: 7,
    status: RESOURCE_STATUS.ACTIVE,
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80',
    description: 'Next-generation smart classroom designed for active learning, flipped classrooms, and collaborative group presentations.',
  },
  {
    name: 'Senate Executive Boardroom',
    code: 'CONF-EXEC-01',
    type: RESOURCE_TYPES.CONFERENCE_ROOM,
    building: 'Chancellery Tower',
    roomNumber: 'Floor 7',
    capacity: 25,
    amenities: ['Polycom 4K Video Conference Bar', 'Integrated Table Microphones', 'Motorized Blackout Blinds', 'Executive Leather Chairs', 'Coffee Station'],
    operatingHours: { openTime: '08:30', closeTime: '19:30' },
    allowedRoles: [ROLES.FACULTY, ROLES.ADMIN],
    minDurationMinutes: 30,
    maxDurationMinutes: 240,
    advanceBookingDaysLimit: 30,
    status: RESOURCE_STATUS.ACTIVE,
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    description: 'Executive conference room reserved for department chair meetings, institutional review boards, and committee hearings.',
  },
  {
    name: 'Sony 4K HDR High-Lumen Cinema Projector',
    code: 'EQ-PROJ-01',
    type: RESOURCE_TYPES.EQUIPMENT,
    building: 'Central Equipment Depot',
    roomNumber: 'Asset Locker 12',
    capacity: 1,
    amenities: ['7500 Lumens Laser Engine', 'Wireless HDMI Transmitter Kit', 'Heavy-Duty Flight Case', 'Motorized Lens Shift'],
    operatingHours: { openTime: '08:00', closeTime: '18:00' },
    allowedRoles: [ROLES.STUDENT, ROLES.FACULTY, ROLES.ADMIN],
    minDurationMinutes: 60,
    maxDurationMinutes: 480,
    advanceBookingDaysLimit: 14,
    status: RESOURCE_STATUS.ACTIVE,
    imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80',
    description: 'Portable ultra-bright 4K projector kit available for large departmental symposiums and outdoor research presentations.',
  },
];

const seedData = async () => {
  try {
    console.log('[Seeder] Connecting to database...');
    await connectDB();

    console.log('[Seeder] Cleaning existing test collections...');
    await Promise.all([
      User.deleteMany({}),
      Resource.deleteMany({}),
      Booking.deleteMany({}),
      ReservationSlot.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    console.log('[Seeder] Creating demonstration users...');
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@campusflow.edu',
      password: 'Admin@CampusFlow2026',
      role: ROLES.ADMIN,
      department: 'Campus IT Operations',
      studentOrEmployeeId: 'EMP-ADM-001',
      phone: '+1 (555) 019-2831',
    });

    const facultyUser = await User.create({
      name: 'Prof. Rajesh Rajan',
      email: 'faculty.rajan@campusflow.edu',
      password: 'Faculty@CampusFlow2026',
      role: ROLES.FACULTY,
      department: 'Computer Science & Engineering',
      studentOrEmployeeId: 'FAC-CSE-104',
      phone: '+1 (555) 019-4822',
    });

    const studentUser = await User.create({
      name: 'Manan Sharma',
      email: 'student.manan@campusflow.edu',
      password: 'Student@CampusFlow2026',
      role: ROLES.STUDENT,
      department: 'Computer Science & Engineering',
      studentOrEmployeeId: 'STU-2026-891',
      phone: '+1 (555) 019-9944',
    });

    console.log('[Seeder] Creating realistic campus resources...');
    const createdResources = await Resource.insertMany(sampleResources);
    const labCS = createdResources.find((r) => r.code === 'LAB-CS-101');
    const auditorium = createdResources.find((r) => r.code === 'AUD-CENTRAL-01');
    const classroom = createdResources.find((r) => r.code === 'CLS-ENG-204');

    console.log('[Seeder] Creating demonstration bookings with race-safe slots...');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);

    // 1. Approved Booking for Dr. Smith
    const booking1 = await Booking.create({
      bookingNumber: 'BK-DEMO-0001',
      user: facultyUser._id,
      resource: labCS._id,
      date: dateStr,
      startTime: '10:00',
      endTime: '12:00',
      startDateTime: createDateTime(dateStr, '10:00'),
      endDateTime: createDateTime(dateStr, '12:00'),
      purpose: 'Advanced Distributed Systems Practical Exam',
      expectedAttendees: 55,
      status: BOOKING_STATUS.APPROVED,
      reviewedBy: adminUser._id,
      reviewedAt: new Date(),
    });
    await reserveSlots(labCS._id, dateStr, '10:00', '12:00', booking1._id, 'confirmed');

    // 2. Pending Booking for Jane Doe
    const booking2 = await Booking.create({
      bookingNumber: 'BK-DEMO-0002',
      user: studentUser._id,
      resource: auditorium._id,
      date: dateStr,
      startTime: '14:00',
      endTime: '17:00',
      startDateTime: createDateTime(dateStr, '14:00'),
      endDateTime: createDateTime(dateStr, '17:00'),
      purpose: 'Annual IEEE Campus Hackathon Inaugural Ceremony',
      expectedAttendees: 300,
      status: BOOKING_STATUS.PENDING,
    });
    await reserveSlots(auditorium._id, dateStr, '14:00', '17:00', booking2._id, 'held');

    // 3. Pending Booking for Classroom
    const booking3 = await Booking.create({
      bookingNumber: 'BK-DEMO-0003',
      user: studentUser._id,
      resource: classroom._id,
      date: dateStr,
      startTime: '09:00',
      endTime: '10:30',
      startDateTime: createDateTime(dateStr, '09:00'),
      endDateTime: createDateTime(dateStr, '10:30'),
      purpose: 'ACM Student Chapter Algorithmic Discussion',
      expectedAttendees: 35,
      status: BOOKING_STATUS.PENDING,
    });
    await reserveSlots(classroom._id, dateStr, '09:00', '10:30', booking3._id, 'held');

    console.log('[Seeder] Creating demonstration notifications...');
    await Notification.create([
      {
        recipient: facultyUser._id,
        title: 'Booking Approved 🎉',
        message: `Your reservation BK-DEMO-0001 for ${labCS.name} has been approved by campus administration.`,
        type: NOTIFICATION_TYPES.BOOKING_APPROVED,
        link: `/bookings/${booking1._id}`,
        isRead: false,
      },
      {
        recipient: studentUser._id,
        title: 'Booking Request Received',
        message: `Your booking request BK-DEMO-0002 for ${auditorium.name} is currently queued for administrator review.`,
        type: NOTIFICATION_TYPES.BOOKING_CREATED,
        link: `/bookings/${booking2._id}`,
        isRead: false,
      },
    ]);

    console.log('====================================================');
    console.log('✅ [Seeder] Database successfully seeded with:');
    console.log(`   - 3 Demonstration Accounts (Admin, Faculty, Student)`);
    console.log(`   - ${createdResources.length} Diverse Campus Resources (Labs, Halls, Classrooms, Gear)`);
    console.log(`   - 3 Active Bookings with Atomic Slots`);
    console.log(`   - Persistent Notifications`);
    console.log('\nDefault Demonstration Credentials:');
    console.log('   Admin:   admin@campusflow.edu / Admin@CampusFlow2026');
    console.log('   Faculty: faculty.rajan@campusflow.edu / Faculty@CampusFlow2026');
    console.log('   Student: student.manan@campusflow.edu / Student@CampusFlow2026');
    console.log('====================================================');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[Seeder Error] Failed to seed database:', err);
    process.exit(1);
  }
};

seedData();
