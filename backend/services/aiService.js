const Groq = require('groq-sdk');
const dotenv = require('dotenv');

dotenv.config();

const SYSTEM_PROMPT = `You are a medical triage assistant for an ambulance dispatch system. 
Analyze the patient description and return ONLY a JSON object with exactly this format:
{
  "severity": "critical" or "moderate" or "mild",
  "requiredSpecialization": "cardiac" or "trauma" or "respiratory" or "general" or "neurology" or "pediatric",
  "aiReasoning": "One sentence explanation of your assessment"
}

Rules:
- Return ONLY the JSON object, no markdown, no code blocks, no additional text
- severity must be exactly one of: critical, moderate, mild
- requiredSpecialization must be exactly one of: cardiac, trauma, respiratory, general, neurology, pediatric
- aiReasoning should be a brief medical justification`;

async function analyzePatientCondition(patientDescription) {
  console.log('=== AI Analysis Start ===');
  console.log('Patient Description:', patientDescription);
  
  try {
    // Check if API key exists
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      console.log('No valid Groq API key found, using fallback');
      return getFallbackResponse(patientDescription);
    }
    
    // Initialize Groq client
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
    
    // Updated models list based on available models
    const modelsToTry = [
      'openai/gpt-oss-120b',      // Most capable
      'openai/gpt-oss-20b',       // Good balance
      'qwen/qwen3.6-27b',         // Alibaba's model
      'qwen/qwen3.8-27b',         // Alibaba's newer model
      'groq/compound',            // Groq's compound model
      'allam-2-7b'                // SDAIA's model
    ];
    
    for (const modelName of modelsToTry) {
      try {
        console.log('Trying Groq model:', modelName);
        
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT
            },
            {
              role: 'user',
              content: `Patient Description: ${patientDescription}`
            }
          ],
          model: modelName,
          temperature: 0.3,
          max_tokens: 200,
          top_p: 1,
          stream: false
        });
        
        const responseText = completion.choices[0]?.message?.content || '';
        console.log('SUCCESS with model:', modelName);
        console.log('Raw Groq Response:', responseText);
        
        // Parse and validate the response
        const parsed = parseResponse(responseText, patientDescription);
        console.log('=== AI Analysis End ===');
        return parsed;
        
      } catch (error) {
        console.log('Model ' + modelName + ' failed:', error.message.substring(0, 100));
        // Continue to next model
      }
    }
    
    // All models failed
    console.log('All Groq models failed, using fallback');
    return getFallbackResponse(patientDescription);
    
  } catch (error) {
    console.error('Groq API Error:', error.message);
    console.log('=== AI Analysis End (Error) ===');
    return getFallbackResponse(patientDescription);
  }
}

function parseResponse(text, patientDescription) {
  try {
    // Clean the response
    let cleanedText = text.trim();
    // Remove markdown code blocks if present
    cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    // Remove any leading "JSON" text
    cleanedText = cleanedText.replace(/^JSON\s*/i, '');
    cleanedText = cleanedText.trim();
    
    // Try to parse JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(cleanedText);
    } catch (parseError) {
      console.log('Direct JSON parse failed, trying to extract...');
      // Try to extract JSON from the text
      const jsonMatch = cleanedText.match(/\{.*\}/s);
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } catch (extractError) {
          console.error('Failed to extract JSON:', extractError);
          return getFallbackResponse(patientDescription);
        }
      } else {
        console.log('No JSON found in response');
        return getFallbackResponse(patientDescription);
      }
    }
    
    // Validate and return
    const validated = validateResponse(parsedResponse);
    console.log('Validated Response:', validated);
    return validated;
    
  } catch (error) {
    console.error('Parse error:', error);
    return getFallbackResponse(patientDescription);
  }
}

function validateResponse(response) {
  const validSeverities = ['critical', 'moderate', 'mild'];
  const validSpecializations = ['cardiac', 'trauma', 'respiratory', 'general', 'neurology', 'pediatric'];
  
  const validated = {
    severity: validSeverities.includes(response.severity?.toLowerCase()) 
      ? response.severity.toLowerCase() 
      : 'moderate',
    requiredSpecialization: validSpecializations.includes(response.requiredSpecialization?.toLowerCase()) 
      ? response.requiredSpecialization.toLowerCase() 
      : 'general',
    aiReasoning: response.aiReasoning && typeof response.aiReasoning === 'string' && response.aiReasoning.length > 0 
      ? response.aiReasoning 
      : 'Assessment based on symptoms described'
  };
  
  return validated;
}

function getFallbackResponse(patientDescription) {
  console.log('Using keyword-based fallback analysis');
  
  const desc = patientDescription.toLowerCase();
  let severity = 'moderate';
  let requiredSpecialization = 'general';
  let reasoning = 'Assessment based on keyword analysis';
  
  // Enhanced keyword detection
  if (desc.includes('chest pain') || desc.includes('heart') || desc.includes('cardiac') || 
      desc.includes('heart attack') || (desc.includes('arm') && desc.includes('pain'))) {
    severity = 'critical';
    requiredSpecialization = 'cardiac';
    reasoning = 'Chest pain symptoms suggest potential cardiac emergency requiring immediate attention';
  } else if (desc.includes('breathing') || desc.includes('respiratory') || desc.includes('asthma') || 
             desc.includes('shortness of breath') || desc.includes('wheezing') || desc.includes('suffocat')) {
    severity = 'critical';
    requiredSpecialization = 'respiratory';
    reasoning = 'Breathing difficulties indicate respiratory emergency requiring urgent intervention';
  } else if (desc.includes('bleeding') || desc.includes('fracture') || desc.includes('trauma') || 
             desc.includes('accident') || desc.includes('injury') || desc.includes('broken') ||
             desc.includes('leg pain') || desc.includes('arm pain') || desc.includes('back pain')) {
    severity = desc.includes('severe') ? 'critical' : 'moderate';
    requiredSpecialization = 'trauma';
    reasoning = desc.includes('severe') 
      ? 'Severe pain suggests possible fracture or serious injury requiring trauma care'
      : 'Pain symptoms require evaluation for possible injury or trauma';
  } else if (desc.includes('seizure') || desc.includes('stroke') || desc.includes('unconscious') || 
             desc.includes('neurological') || desc.includes('paralysis')) {
    severity = 'critical';
    requiredSpecialization = 'neurology';
    reasoning = 'Neurological symptoms suggest critical condition requiring specialist evaluation';
  } else if (desc.includes('child') || desc.includes('baby') || desc.includes('infant') || 
             desc.includes('pediatric') || desc.includes('3-year') || desc.includes('5-year') ||
             desc.includes('toddler')) {
    severity = 'moderate';
    requiredSpecialization = 'pediatric';
    reasoning = 'Pediatric patient requires specialized care and age-appropriate treatment';
  } else if (desc.includes('pregnant') || desc.includes('pregnancy') || desc.includes('labor')) {
    severity = 'moderate';
    requiredSpecialization = 'general';
    reasoning = 'Obstetric case requires general medical attention and possible maternity care';
  } else if (desc.includes('fever') || desc.includes('infection') || desc.includes('flu')) {
    severity = 'moderate';
    requiredSpecialization = 'general';
    reasoning = 'Fever symptoms require general medical evaluation and possible infection treatment';
  } else if (desc.includes('diabet') || desc.includes('sugar') || desc.includes('insulin')) {
    severity = 'moderate';
    requiredSpecialization = 'general';
    reasoning = 'Diabetic symptoms require general medical attention and blood sugar management';
  } else if (desc.includes('burn') || desc.includes('fire') || desc.includes('scald')) {
    severity = 'moderate';
    requiredSpecialization = 'general';
    reasoning = 'Burn injuries require general medical care and possible specialist referral';
  } else if (desc.includes('headache') || desc.includes('migraine')) {
    severity = 'mild';
    requiredSpecialization = 'general';
    reasoning = 'Headache symptoms require general medical evaluation';
  } else if (desc.includes('nausea') || desc.includes('vomit') || desc.includes('diarrhea')) {
    severity = 'mild';
    requiredSpecialization = 'general';
    reasoning = 'Gastrointestinal symptoms require general medical attention';
  }
  
  console.log('Fallback Response:', { severity, requiredSpecialization, aiReasoning: reasoning });
  return { severity, requiredSpecialization, aiReasoning: reasoning };
}

module.exports = { analyzePatientCondition };
