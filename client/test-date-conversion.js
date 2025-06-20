// Test date conversion
const testDate = "2025-06-10";
console.log("Input date:", testDate);

// Current implementation
const dateObj = new Date(testDate + 'T00:00:00');
console.log("Created date object:", dateObj);
console.log("ISO string:", dateObj.toISOString());
console.log("Local string:", dateObj.toString());

// Better implementation - use EST timezone consistently
const estDate = new Date(testDate + 'T00:00:00-05:00'); // EST is UTC-5 (or UTC-4 during DST)
console.log("EST date object:", estDate);
console.log("EST ISO string:", estDate.toISOString());

// Alternative - keep date as is without timezone conversion
const utcDate = new Date(testDate + 'T12:00:00.000Z'); // Noon UTC to avoid date shift
console.log("UTC noon date:", utcDate);
console.log("UTC noon ISO:", utcDate.toISOString());
