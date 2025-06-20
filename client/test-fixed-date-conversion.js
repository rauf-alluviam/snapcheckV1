// Test the updated date conversion logic directly
const toISODateTime = (date) => {
  if (typeof date === 'string') {
    // If it's already an ISO string, return as is
    if (date.includes('T') && date.includes('Z')) {
      return date;
    }
    
    // If it's a date string (YYYY-MM-DD), convert to noon UTC to avoid date shifting
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Use noon UTC to preserve the date regardless of timezone
      return date + 'T12:00:00.000Z';
    }
    
    // Try to parse as a general date string
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date: ${date}`);
    }
    return dateObj.toISOString();
  }
  
  if (date instanceof Date) {
    return date.toISOString();
  }
  
  throw new Error(`Invalid date input: ${date}`);
};

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
