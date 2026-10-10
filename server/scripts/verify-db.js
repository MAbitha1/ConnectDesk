import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectDB, getDBHealthStatus } from '../config/db.js';
import { Customer } from '../models/Customer.js';
import { Task } from '../models/Task.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function runVerification() {
  console.log('--- ConnectDesk Database Verification Script ---');
  console.log(`Target MONGODB_URI: ${process.env.MONGODB_URI ? process.env.MONGODB_URI : '[Missing]'}`);

  const connected = await connectDB();
  const status = getDBHealthStatus();
  console.log(`Database Health Status:`, JSON.stringify(status, null, 2));

  if (!connected) {
    console.error('❌ Connection verification FAILED. Could not establish MongoDB connection.');
    process.exit(1);
  }

  try {
    console.log('\n--- 1. Testing Customer Model Creation ---');
    const testCust = await Customer.create({
      name: 'Verification Test User',
      company: 'Test Cybernetics',
      email: `test.${Date.now()}@testcyber.com`,
      phone: '+1 (555) 999-8888',
      status: 'Proposal',
      dealValue: 50000,
      notes: 'Automated verification test customer document'
    });
    console.log(`✅ Created Customer: ID ${testCust._id} | Name: ${testCust.name} | Company: ${testCust.company}`);

    console.log('\n--- 2. Testing Task Model Creation with Ref ---');
    const testTask = await Task.create({
      title: 'Verification task for test customer',
      customer: testCust._id,
      priority: 'High',
      category: 'System Test',
      status: 'Pending'
    });
    console.log(`✅ Created Task: ID ${testTask._id} | Title: ${testTask.title} | Ref Customer: ${testTask.customer}`);

    console.log('\n--- 3. Testing Population Query ---');
    const populatedTask = await Task.findById(testTask._id).populate('customer');
    console.log(`✅ Populated Task query successful! Linked Customer Company: ${populatedTask.customer.company}`);

    console.log('\n--- 4. Cleaning Up Test Data ---');
    await Task.findByIdAndDelete(testTask._id);
    await Customer.findByIdAndDelete(testCust._id);
    console.log('✅ Cleaned up verification test documents.');

    console.log('\n🎉 ALL MONGODB VERIFICATION TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Model verification FAILED with error:', error);
    process.exit(1);
  }
}

runVerification();
