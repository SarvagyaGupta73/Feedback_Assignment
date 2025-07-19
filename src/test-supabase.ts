import { supabase } from './lib/supabase'

// Test Supabase connection and form data
async function testSupabaseConnection() {
  console.log('Testing Supabase connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('forms')
      .select('id, title, is_active')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection error:', error)
      return
    }
    
    console.log('✅ Supabase connection successful')
    console.log('Forms found:', data)
    
    if (data && data.length > 0) {
      const formId = data[0].id
      console.log(`Testing form submission for form: ${formId}`)
      
      // Test form submission
      const { data: response, error: responseError } = await supabase
        .from('responses')
        .insert({
          form_id: formId,
          ip_address: '127.0.0.1',
          user_agent: 'Test Script'
        })
        .select()
        .single()
      
      if (responseError) {
        console.error('❌ Form submission test failed:', responseError)
      } else {
        console.log('✅ Form submission test successful:', response)
        
        // Clean up test response
        await supabase
          .from('responses')
          .delete()
          .eq('id', response.id)
        
        console.log('✅ Test response cleaned up')
      }
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err)
  }
}

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testSupabaseConnection()
}

export { testSupabaseConnection }
