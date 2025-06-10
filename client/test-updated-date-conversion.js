// Test the updated date conversion function
import { toISODateTime } from './src/utils/dateUtils.js';

const testDate = "2025-06-10";
console.log("Input date:", testDate);

try {
  const result = toISODateTime(testDate);
  console.log("Updated toISODateTime result:", result);
  
  // Verify the date is preserved
  const parsedDate = new Date(result);
  console.log("Parsed date (UTC):", parsedDate.toISOString());
  console.log("Parsed date (local):", parsedDate.toString());
  
  // Check if the date part is preserved
  const dateOnly = result.split('T')[0];
  console.log("Date part preserved:", dateOnly === testDate ? "✅ YES" : "❌ NO");
  
} catch (error) {
  console.error("Error:", error.message);
}
