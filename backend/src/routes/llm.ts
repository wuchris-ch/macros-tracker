import express from 'express';
import axios from 'axios';

const router = express.Router();

interface CalorieEstimationRequest {
  description: string;
  apiKey: string;
}

interface CalorieEstimationResponse {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: 'high' | 'medium' | 'low';
  reasoning?: string;
}

// POST /api/llm/estimate-calories - Estimate calories from food description
router.post('/estimate-calories', async (req, res) => {
  try {
    const { description, apiKey }: CalorieEstimationRequest = req.body;
    const model = 'x-ai/grok-4-fast:free'; // Hardcoded to use grok-4-fast:free

    // Validate required fields
    if (!description || !apiKey) {
      return res.status(400).json({
        error: 'Missing required fields: description and apiKey are required'
      });
    }

    // Validate description is not empty
    if (description.trim().length === 0) {
      return res.status(400).json({ error: 'Description cannot be empty' });
    }


    const prompt = `You are a nutrition expert. Estimate the total calories and macronutrients for the following food description.
    
Food description: "${description}"

Please respond with ONLY a JSON object in this exact format:
{
  "calories": <number>,
  "protein": <number in grams>,
  "carbs": <number in grams>,
  "fat": <number in grams>,
  "confidence": "<high|medium|low>",
  "reasoning": "<brief explanation of your estimate>"
}

Guidelines:
- Provide your best estimate based on typical serving sizes
- Include macronutrients in grams (protein, carbohydrates, fat)
- Use "high" confidence for common foods with clear portions
- Use "medium" confidence for foods with unclear portions
- Use "low" confidence for very vague descriptions
- Keep reasoning brief (1-2 sentences)
- If multiple items are mentioned, provide the total values for all items combined
- Round macronutrients to 1 decimal place`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3001',
          'X-Title': 'Calorie Tracker App'
        }
      }
    );

    const llmResponse = response.data.choices[0].message.content;
    
    try {
      // Parse the JSON response from the LLM
      const parsedResponse: CalorieEstimationResponse = JSON.parse(llmResponse);
      
      // Validate the response structure
      if (typeof parsedResponse.calories !== 'number' ||
          typeof parsedResponse.protein !== 'number' ||
          typeof parsedResponse.carbs !== 'number' ||
          typeof parsedResponse.fat !== 'number' ||
          !['high', 'medium', 'low'].includes(parsedResponse.confidence)) {
        throw new Error('Invalid response format from LLM');
      }

      // Ensure all values are positive numbers
      if (parsedResponse.calories < 0) parsedResponse.calories = 0;
      if (parsedResponse.protein < 0) parsedResponse.protein = 0;
      if (parsedResponse.carbs < 0) parsedResponse.carbs = 0;
      if (parsedResponse.fat < 0) parsedResponse.fat = 0;

      res.json(parsedResponse);
    } catch (parseError) {
      console.error('Error parsing LLM response:', parseError);
      console.error('Raw LLM response:', llmResponse);
      
      // Fallback: try to extract just the number if JSON parsing fails
      const calorieMatch = llmResponse.match(/(\d+)/);
      if (calorieMatch) {
        res.json({
          calories: parseInt(calorieMatch[1]),
          protein: 0,
          carbs: 0,
          fat: 0,
          confidence: 'low' as const,
          reasoning: 'Estimated from partial response - macronutrients unavailable'
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to parse calorie estimation from LLM response' 
        });
      }
    }
  } catch (error) {
    console.error('Error estimating calories:', error);
    
    if (axios.isAxiosError(error)) {
      // Log the full error response for debugging
      if (error.response) {
        console.error('API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      if (error.response?.status === 401) {
        return res.status(401).json({
          error: 'Invalid API key for Fuelix proxy. Please check your API key format.',
          details: error.response.data
        });
      } else if (error.response?.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      } else if (error.response && error.response.status >= 400 && error.response.status < 500) {
        return res.status(400).json({
          error: 'Invalid request to LLM API',
          details: error.response.data
        });
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/llm/models - Get available models (for future use)
router.get('/models', (req, res) => {
  const availableModels = [
    { id: 'x-ai/grok-4-fast:free', name: 'Grok 4 Fast (Free)', description: 'xAI\'s latest multimodal model - Free tier' },
    { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient OpenAI model' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', description: 'Latest GPT-4 model' },
    { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fast Anthropic model' },
    { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced Anthropic model' },
    { id: 'google/gemini-pro', name: 'Gemini Pro', description: 'Google AI model' }
  ];
  
  res.json(availableModels);
});

export { router as llmRouter };
