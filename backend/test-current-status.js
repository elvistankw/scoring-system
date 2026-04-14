// Test current competition status and auto-logic
require('dotenv').config();

async function testCurrentStatus() {
  try {
    // Test the auto-status logic directly
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log('🔍 Testing Auto-Status Logic');
    console.log(`📅 Today's date: ${today.toISOString().split('T')[0]}`);
    console.log('');
    
    // Test different dates
    const testDates = [
      '2026-04-13', // Yesterday (should be active)
      '2026-04-14', // Today (should be active)  
      '2026-04-15', // Tomorrow (should be upcoming)
    ];
    
    testDates.forEach(dateStr => {
      const testDate = new Date(dateStr);
      testDate.setHours(0, 0, 0, 0);
      
      const shouldBeActive = testDate.getTime() <= today.getTime();
      const expectedStatus = shouldBeActive ? 'active' : 'upcoming';
      
      let comparison = '';
      if (testDate.getTime() < today.getTime()) {
        comparison = 'PAST';
      } else if (testDate.getTime() === today.getTime()) {
        comparison = 'TODAY';
      } else {
        comparison = 'FUTURE';
      }
      
      console.log(`📊 Date: ${dateStr} (${comparison})`);
      console.log(`   Expected Status: ${expectedStatus}`);
      console.log(`   Logic: start_date <= today → ${shouldBeActive}`);
      console.log('');
    });
    
    console.log('✅ Auto-status logic test completed');
    console.log('');
    console.log('💡 Expected Behavior:');
    console.log('   • 2026-04-13 (yesterday) → active');
    console.log('   • 2026-04-14 (today) → active');
    console.log('   • 2026-04-15 (tomorrow) → upcoming');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testCurrentStatus();