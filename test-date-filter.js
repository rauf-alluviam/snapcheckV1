import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Inspection from './server/models/Inspection.js';
import User from './server/models/User.js';
import dayjs from 'dayjs';

dotenv.config();

async function testDateFiltering() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Test the user-wise API logic with the corrected date filtering
    const end = dayjs();
    const start = end.subtract(30, 'day');
    
    console.log('Date range for testing:');
    console.log('Start:', start.format('YYYY-MM-DD'));
    console.log('End:', end.format('YYYY-MM-DD'));
    
    const matchStage = {
      inspectionDate: {
        $gte: start.toDate(),
        $lte: end.toDate()
      }
    };
    
    console.log('\nFilter by inspectionDate (should show all 6 inspections):');
    
    const inspections = await Inspection.find(matchStage);
    console.log('Inspections found in date range (by inspectionDate):', inspections.length);
    
    inspections.forEach((inspection, index) => {
      console.log(`${index + 1}. ID: ${inspection._id}`);
      console.log(`   Status: ${inspection.status}`);
      console.log(`   Assigned To: ${inspection.assignedTo}`);
      console.log(`   Inspection Date: ${inspection.inspectionDate}`);
      console.log(`   Created At: ${inspection.createdAt}`);
    });
    
    // Now test filtering by createdAt to show the difference
    const createdAtFilter = {
      createdAt: {
        $gte: start.toDate(),
        $lte: end.toDate()
      }
    };
    
    console.log('\nFilter by createdAt (for comparison):');
    const inspectionsByCreatedAt = await Inspection.find(createdAtFilter);
    console.log('Inspections found in date range (by createdAt):', inspectionsByCreatedAt.length);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testDateFiltering();
