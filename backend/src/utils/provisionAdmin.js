const readline = require('readline');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const { ROLES } = require('../config/constants');

const promptInput = (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

const provisionAdmin = async () => {
  try {
    console.log('====================================================');
    console.log('CampusFlow — Secure Administrator Provisioning Tool');
    console.log('====================================================');

    let name = process.env.ADMIN_NAME;
    let email = process.env.ADMIN_EMAIL;
    let password = process.env.ADMIN_PASSWORD;
    let department = process.env.ADMIN_DEPT || 'Campus IT Administration';

    if (!email || !password) {
      console.log('Environment variables ADMIN_EMAIL or ADMIN_PASSWORD not detected.');
      console.log('Entering interactive input mode:\n');

      name = name || (await promptInput('Enter Administrator Full Name: '));
      email = await promptInput('Enter Administrator Email Address: ');
      password = await promptInput('Enter Administrator Password (min 8 chars, mixed case, number, symbol): ');
      department = await promptInput('Enter Department [Campus IT Administration]: ') || department;
    }

    if (!name || !email || !password) {
      console.error('Error: Name, email, and password are all required to provision an administrator.');
      process.exit(1);
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&^#()_\-+=<>.,:;])[A-Za-z\d@$!%*?&^#()_\-+=<>.,:;]{8,}$/;
    if (!passwordRegex.test(password)) {
      console.error('Error: Password does not meet security requirements.');
      console.error('Must have at least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special symbol.');
      process.exit(1);
    }

    await connectDB();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log(`User ${email} already exists. Elevating/updating administrator status...`);
      existingUser.name = name;
      existingUser.role = ROLES.ADMIN;
      existingUser.department = department;
      existingUser.password = password; // Triggers bcrypt pre-save hook
      existingUser.isActive = true;
      await existingUser.save();
      console.log(`✅ Administrator credentials updated for: ${email}`);
    } else {
      await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role: ROLES.ADMIN,
        department,
        studentOrEmployeeId: 'ADMIN-PROVISIONED',
      });
      console.log(`✅ New Administrator account provisioned for: ${email}`);
    }

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error(`[Provisioning Error] Failed: ${error.message}`);
    process.exit(1);
  }
};

provisionAdmin();
