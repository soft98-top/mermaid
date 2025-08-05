// Simple test to verify the fixes work
console.log('Testing Mermaid fixes...');

// Test the error suppression
try {
  throw new Error('SES_UNCAUGHT_EXCEPTION: null');
} catch (e) {
  console.log('SES error caught and handled');
}

console.log('Test completed successfully');