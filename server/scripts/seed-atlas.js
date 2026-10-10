import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/User.js';
import { Customer } from '../models/Customer.js';
import { Task } from '../models/Task.js';
import { FollowUp } from '../models/FollowUp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function seedAtlasData() {
  console.log('=====================================================');
  console.log('🌱 CONNECTDESK MONGODB ATLAS SAMPLE DATA SEEDER');
  console.log('=====================================================');

  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<username>')) {
    console.error('❌ MONGODB_URI is missing or contains placeholder credentials.');
    process.exit(1);
  }

  console.log(`Connecting to Mongo Atlas host...`);

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log(`✅ Connected successfully to Atlas Cluster: ${mongoose.connection.host}/${mongoose.connection.name}`);

    // 1. Create or retrieve Demo User
    const demoEmail = 'demo@connectdesk.io';
    let user = await User.findOne({ email: demoEmail });

    if (!user) {
      user = await User.create({
        name: 'Abitha Manager',
        email: demoEmail,
        password: 'password123'
      });
      console.log(`✅ Created Demo User: ID ${user._id} (${user.email})`);
    } else {
      console.log(`ℹ️ Found existing Demo User: ID ${user._id} (${user.email})`);
    }

    // Clear previous sample data for this demo user to avoid duplicate key errors
    await Customer.deleteMany({ user: user._id });
    await Task.deleteMany({ user: user._id });
    await FollowUp.deleteMany({ user: user._id });
    console.log('🧹 Cleaned existing sample records for demo user workspace.');

    // 2. Seed Sample Customers
    console.log('\n--- Seeding Customers Collection ---');
    const customersData = [
      {
        user: user._id,
        name: 'Sarah Connor',
        company: 'Acme Enterprise',
        email: 'sarah@acmeenterprise.com',
        phone: '+1 (555) 234-5678',
        status: 'Proposal',
        dealValue: 120000,
        notes: 'Key enterprise decision maker evaluating our annual SLA contract'
      },
      {
        user: user._id,
        name: 'Alex Vance',
        company: 'Nexus Cybernetics',
        email: 'alex.vance@nexuscyber.io',
        phone: '+1 (555) 876-5432',
        status: 'Contacted',
        dealValue: 45000,
        notes: 'Interested in API integrations and custom security controls'
      },
      {
        user: user._id,
        name: 'Elena Rostova',
        company: 'Global Logistics Inc',
        email: 'elena@globallogistics.com',
        phone: '+1 (555) 345-6789',
        status: 'Customer',
        dealValue: 250000,
        notes: 'Existing key customer on 3-year recurring license plan'
      },
      {
        user: user._id,
        name: 'Michael Scott',
        company: 'Starlight Solutions',
        email: 'mscott@starlight.co',
        phone: '+1 (555) 987-6543',
        status: 'Lead',
        dealValue: 15000,
        notes: 'Inbound web lead interested in team seat expansion'
      },
      {
        user: user._id,
        name: 'David Wallace',
        company: 'Apex Tech Labs',
        email: 'dwallace@apextech.io',
        phone: '+1 (555) 456-7890',
        status: 'Inactive',
        dealValue: 8000,
        notes: 'Previous trial user, pending follow-up in Q1 2027'
      }
    ];

    const seededCustomers = await Customer.insertMany(customersData);
    console.log(`✅ Seeded ${seededCustomers.length} Customers into Atlas.`);

    // 3. Seed Sample Tasks
    console.log('\n--- Seeding Tasks Collection ---');
    const tasksData = [
      {
        user: user._id,
        customer: seededCustomers[0]._id, // Acme Enterprise
        title: 'Finalize enterprise SLA contract proposal',
        priority: 'High',
        category: 'Proposal',
        status: 'In Progress',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        user: user._id,
        customer: seededCustomers[1]._id, // Nexus Cybernetics
        title: 'Schedule technical API architecture review',
        priority: 'Medium',
        category: 'Meeting',
        status: 'Pending',
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000)
      },
      {
        user: user._id,
        customer: seededCustomers[2]._id, // Global Logistics
        title: 'Conduct Q3 account executive review call',
        priority: 'High',
        category: 'Account Review',
        status: 'Completed',
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        user: user._id,
        customer: seededCustomers[3]._id, // Starlight Solutions
        title: 'Send product demo recording & pricing breakdown',
        priority: 'Low',
        category: 'Follow Up',
        status: 'Pending',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      }
    ];

    const seededTasks = await Task.insertMany(tasksData);
    console.log(`✅ Seeded ${seededTasks.length} Tasks into Atlas.`);

    // 4. Seed Sample Follow-ups
    console.log('\n--- Seeding Follow-ups Collection ---');
    const followUpsData = [
      {
        user: user._id,
        customer: seededCustomers[0]._id,
        title: 'Executive Discovery Call with CTO',
        type: 'Call',
        scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        notes: 'Discuss cloud infrastructure migration scope and compliance specs',
        completed: false
      },
      {
        user: user._id,
        customer: seededCustomers[1]._id,
        title: 'Send Enterprise Tier Pricing Quote',
        type: 'Email',
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        notes: 'Include 15% annual multi-seat discount schedule',
        completed: false
      },
      {
        user: user._id,
        customer: seededCustomers[2]._id,
        title: 'Quarterly Executive Sync Meeting',
        type: 'Meeting',
        scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        notes: 'Reviewed current SLA metrics and planned upcoming feature requests',
        completed: true
      }
    ];

    const seededFollowUps = await FollowUp.insertMany(followUpsData);
    console.log(`✅ Seeded ${seededFollowUps.length} Follow-ups into Atlas.`);

    console.log('\n=====================================================');
    console.log('🎉 MONGODB ATLAS SAMPLE DATA SEEDING COMPLETE!');
    console.log(`Demo Account Login Credentials:`);
    console.log(`   Email:    demo@connectdesk.io`);
    console.log(`   Password: password123`);
    console.log('=====================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
}

seedAtlasData();
