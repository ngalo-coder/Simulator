import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5001';

async function testSpecialtyVisibilityAPI() {
  try {
    console.log('Testing specialty visibility endpoint...\n');

    // Test public endpoint
    const response = await fetch(`${API_BASE_URL}/api/admin/specialties/visibility-public`);
    
    if (!response.ok) {
      console.error(`Response status: ${response.status}`);
      const error = await response.text();
      console.error('Error:', error);
      return;
    }

    const data = await response.json();
    console.log('Full Response:', JSON.stringify(data, null, 2));

    // Analyze the data
    const specialties = data.data?.specialties || data.specialties || [];
    console.log(`\nTotal specialties: ${specialties.length}\n`);

    // Group by program area
    const byProgramArea = {};
    specialties.forEach(s => {
      const pa = s.programArea || 'unknown';
      if (!byProgramArea[pa]) byProgramArea[pa] = [];
      byProgramArea[pa].push(s.specialtyId);
    });

    console.log('Specialties grouped by programArea:');
    Object.entries(byProgramArea).forEach(([pa, specs]) => {
      console.log(`\n  ${pa} (${specs.length} specialties):`);
      specs.slice(0, 5).forEach(s => console.log(`    - ${s}`));
      if (specs.length > 5) {
        console.log(`    ... and ${specs.length - 5} more`);
      }
    });

    // Check visibility status
    const visible = specialties.filter(s => s.isVisible);
    const hidden = specialties.filter(s => !s.isVisible);
    console.log(`\nVisibility Status:`);
    console.log(`  Visible: ${visible.length}`);
    console.log(`  Hidden: ${hidden.length}`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSpecialtyVisibilityAPI();