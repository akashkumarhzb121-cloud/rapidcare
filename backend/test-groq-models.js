const Groq = require('groq-sdk');
const dotenv = require('dotenv');
dotenv.config();

async function listAvailableModels() {
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
    
    console.log('Fetching available Groq models...\n');
    
    // Try to list models
    try {
      const models = await groq.models.list();
      console.log('Available models:');
      models.data.forEach(model => {
        console.log(`  - ${model.id}`);
        console.log(`    Owner: ${model.owned_by}`);
        console.log(`    Created: ${new Date(model.created * 1000).toLocaleDateString()}`);
        console.log('');
      });
    } catch (listError) {
      console.log('Cannot list models directly, testing common models...\n');
      
      // Test common Groq models
      const modelsToTest = [
        'llama-3.1-70b-versatile',
        'llama-3.1-8b-instant',
        'llama3-70b-8192',
        'llama3-8b-8192',
        'mixtral-8x7b-32768',
        'gemma2-9b-it',
        'gemma-7b-it',
        'llama-3.2-3b-preview',
        'llama-3.2-1b-preview',
        'llama-3.2-11b-text-preview',
        'llama-3.2-90b-text-preview',
        'llama-guard-3-8b',
        'whisper-large-v3',
        'whisper-large-v3-turbo'
      ];
      
      for (const modelName of modelsToTest) {
        try {
          console.log(`Testing model: ${modelName}...`);
          const completion = await groq.chat.completions.create({
            messages: [
              {
                role: 'user',
                content: 'Say "OK" if you can hear me'
              }
            ],
            model: modelName,
            max_tokens: 10
          });
          
          console.log(`✓ Model works: ${modelName}`);
          console.log(`  Response: ${completion.choices[0]?.message?.content}\n`);
          
        } catch (error) {
          const errorMsg = error.message || '';
          if (errorMsg.includes('does not exist')) {
            console.log(`✗ Model not available: ${modelName}\n`);
          } else if (errorMsg.includes('rate limit')) {
            console.log(`⚠ Rate limited: ${modelName}\n`);
          } else {
            console.log(`? Unknown error for ${modelName}: ${errorMsg.substring(0, 100)}\n`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listAvailableModels();
