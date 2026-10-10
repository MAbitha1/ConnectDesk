import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { User } from '../models/User.js';
import { Customer } from '../models/Customer.js';
import { Task } from '../models/Task.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyAtlas() {
  console.log('=== VERIFYING MONGODB ATLAS CONNECTION ===');
  const uri = process.env.MONGODB_URI;
  console.log('Connecting to URI:', uri ? uri.replace(/:([^@]+)@/, ':****@') : 'MISSING');

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB Atlas successfully!');
    console.log(`Database Host: ${mongoose.connection.host}`);
    console.log(`Database Name: ${mongoose.connection.name}`);

    // 1. User creation test
    const testEmail = `atlas.test.${Date.now()}@connectdesk.io`;
    const user = await User.create({
      name: 'Atlas Verified Admin',
      email: testEmail,
      password: 'SecureAtlasPassword123!'
    });
    console.log(`✅ [User Model] Created User in Atlas: ${user._id} (${user.email})`);

    // 2. Customer creation test
    const customer = await Customer.create({
      user: user._id,
      name: 'Atlas Client Corp',
      company: 'Atlas Cyber Tech',
      email: `client.${Date.now()}@atlascyber.com`,
      phone: '+1 800 555 0199',
      status: 'Proposal',
      dealValue: 125000,
      notes: 'MongoDB Atlas live database connectivity test document'
    });
    console.log(`✅ [Customer Model] Created Customer in Atlas: ${customer._id} (${customer.company})`);

    // 3. Task creation test
    const task = await Task.create({
      user: user._id,
      title: 'Setup MongoDB Atlas Production Cluster',
      customer: customer._id,
      priority: 'High',
      category: 'Infrastructure',
      status: 'Completed'
    });
    console.log(`✅ [Task Model] Created Task in Atlas: ${task._id} (${task.title})`);

    // 4. Populate Query test
    const populated = await Task.findById(task._id).populate('customer').populate('user');
    console.log(`✅ [Populate Query] Verified relations in Atlas: Task linked to Customer "${populated.customer.company}" by User "${populated.user.name}"`);

    // 5. Cleanup test data
    await Task.findByIdAndDelete(task._id);
    await Customer.findByIdAndDelete(customer._id);
    await User.findByIdAndDelete(user._id);
    console.log('✅ [Cleanup] Successfully removed test data from Atlas cluster');

    console.log('\n======================================================');
    console.log('🎉 MONGODB ATLAS IS FULLY CONNECTED AND OPERATIONAL!');
    console.log('======================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ MONGODB ATLAS VERIFICATION FAILED:', error);
    process.exit(1);
  }
}

verifyAtlas();
