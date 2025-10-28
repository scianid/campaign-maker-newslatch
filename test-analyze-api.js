// Test script for the async campaign analysis system
// Run this in browser console after logging in

async function testAnalyzeAPI() {
  console.log('🧪 Testing Async Campaign Analysis System...\n');
  
  const testUrl = 'https://example.com';
  
  try {
    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error('❌ Not authenticated');
      return;
    }
    console.log('✅ Authenticated');
    
    // Step 1: Submit analysis job
    console.log('\n📤 Submitting analysis job for:', testUrl);
    const submitResponse = await fetch(
      'https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/analyze-url',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: testUrl })
      }
    );
    
    if (!submitResponse.ok) {
      const error = await submitResponse.json();
      console.error('❌ Failed to submit job:', error);
      return;
    }
    
    const jobData = await submitResponse.json();
    console.log('✅ Job submitted:', jobData);
    
    // Step 2: Check job status
    console.log('\n🔍 Checking job status...');
    const statusResponse = await fetch(
      `https://emvwmwdsaakdnweyhmki.supabase.co/functions/v1/check-job-status/${jobData.jobId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      }
    );
    
    if (!statusResponse.ok) {
      const error = await statusResponse.json();
      console.error('❌ Failed to check status:', error);
      return;
    }
    
    const statusData = await statusResponse.json();
    console.log('✅ Job status:', statusData);
    
    // Step 3: Show progress details
    console.log('\n📊 Progress Details:');
    console.log('  Status:', statusData.status);
    console.log('  Current Step:', statusData.currentStep);
    console.log('  Progress Message:', statusData.progressMessage);
    
    // Step 4: Show results if complete
    if (statusData.status === 'COMPLETED') {
      console.log('\n🎉 Job completed!');
      console.log('Results:');
      console.log('  Suggested Tags:', statusData.result?.suggestedTags);
      console.log('  Description:', statusData.result?.suggestedDescription);
      console.log('  Product Description:', statusData.result?.productDescription);
      console.log('  Target Audience:', statusData.result?.targetAudience);
      if (statusData.result?.metadata) {
        console.log('  Metadata:', statusData.result.metadata);
      }
    } else {
      console.log(`\n⏳ Job is ${statusData.status}. In production, we would poll every 3 seconds.`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAnalyzeAPI();
