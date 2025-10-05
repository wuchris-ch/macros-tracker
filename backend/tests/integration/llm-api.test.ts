import request from 'supertest';
import express from 'express';
import { llmRouter } from '../../src/routes/llm';
import { createOpenRouterMock } from '../mocks/openrouter';
import { validFoodDescriptions, ambiguousFoodDescriptions, invalidFoodDescriptions } from '../fixtures/food-descriptions';
import nock from 'nock';

const app = express();
app.use(express.json());
app.use('/api/llm', llmRouter);

describe('LLM API Integration Tests', () => {
  let openRouterMock: ReturnType<typeof createOpenRouterMock>;

  beforeEach(() => {
    openRouterMock = createOpenRouterMock();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('POST /api/llm/estimate-calories', () => {
    const validApiKey = 'test-api-key';

    describe('Successful calorie estimation', () => {
      it('should estimate calories for a simple food description', async () => {
        const foodDescription = validFoodDescriptions[0]; // "1 medium apple"
        
        // Mock successful OpenRouter response
        nock('https://openrouter.ai/api/v1')
          .post('/chat/completions')
          .reply(200, {
            id: 'chatcmpl-test-123',
            object: 'chat.completion',
            created: Date.now(),
            model: 'deepseek/deepseek-chat-v3.1:free',
            choices: [{
              index: 0,
              message: {
                role: 'assistant',
                content: JSON.stringify({
                  calories: 95,
                  protein: 0.5,
                  carbs: 25.0,
                  fat: 0.3,
                  confidence: 'high',
                  reasoning: 'A medium apple typically contains about 95 calories with minimal protein and fat.'
                })
              },
              finish_reason: 'stop'
            }],
            usage: {
              prompt_tokens: 150,
              completion_tokens: 50,
              total_tokens: 200
            }
          });

        const response = await request(app)
          .post('/api/llm/estimate-calories')
          .send({
            description: foodDescription.description,
            apiKey: validApiKey
          });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          calories: 95,
          protein: 0.5,
          carbs: 25.0,
          fat: 0.3,
          confidence: 'high',
          reasoning: expect.any(String)
        });
      });

      it('should estimate calories for a complex food description', async () => {
        const complexFood = "Large Caesar salad with grilled chicken, croutons, and parmesan cheese";
        
        nock('https://openrouter.ai/api/v1')
          .post('/chat/completions')
          .reply(200, {
            id: 'chatcmpl-test-456',
            object: 'chat.completion',
            created: Date.now(),
            model: 'deepseek/deepseek-chat-v3.1:free',
            choices: [{
              index: 0,
              message: {
                role: 'assistant',
                content: JSON.stringify({
                  calories: 470,
                  protein: 35.2,
                  carbs: 15.8,
                  fat: 28.5,
                  confidence: 'medium',
                  reasoning: 'Large Caesar salad with chicken varies but typically around 470 calories.'
                })
              },
              finish_reason: 'stop'
            }]
          });

        const response = await request(app)
          .post('/api/llm/estimate-calories')
          .send({
            description: complexFood,
            apiKey: validApiKey
          });

        expect(response.status).toBe(200);
        expect(response.body.calories).toBe(470);
        expect(response.body.confidence).toBe('medium');
        expect(response.body.protein).toBeGreaterThan(0);
        expect(response.body.carbs).toBeGreaterThan(0);
        expect(response.body.fat).toBeGreaterThan(0);
      });

      it('should handle ambiguous food descriptions with low confidence', async () => {
        const ambiguousFood = ambiguousFoodDescriptions[0]; // "pasta"
        
        nock('https://openrouter.ai/api/v1')
          .post('/chat/completions')
          .reply(200, {
            id: 'chatcmpl-test-789',
            object: 'chat.completion',
            created: Date.now(),
            model: 'deepseek/deepseek-chat-v3.1:free',
            choices: [{
              index: 0,
              message: {
                role: 'assistant',
                content: JSON.stringify({
                  calories: 220,
                  protein: 8.0,
                  carbs: 44.0,
                  fat: 1.5,
                  confidence: 'low',
                  reasoning: 'Pasta description is vague - could range from 200-800 calories depending on portion and sauce.'
                })
              },
              finish_reason: 'stop'
            }]
          });

        const response = await request(app)
          .post('/api/llm/estimate-calories')
          .send({
            description: ambiguousFood.description,
            apiKey: validApiKey
          });

        expect(response.status).toBe(200);
        expect(response.body.confidence).toBe('low');
        expect(response.body.reasoning).toContain('vague');
      });
    });

    describe('Error handling', () => {
      it('should return 400 for missing description', async () => {
        const response = await request(app)
          .post('/api/llm/estimate-calories')
          .send({
            apiKey: validApiKey
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Missing required fields');
      });

      it('should return 400 for missing API key', async () => {
        const response = await request(app)
          .post('/api/llm/estimate-calories')
          .send({
            description: 'apple'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Missing required fields');
      });

      it('should return 400 for empty description', async () => {
        const response = await request(app)
          .post('/api/llm/estimate-calories')
          .send({
            description: '   ',
            apiKey: validApiKey
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Description cannot be empty');
      });

      it('should handle 401 unauthorized from OpenRouter', async () => {
        nock('https://openrouter.ai/api/v1')
          .post('/chat/completions')
          .reply(401, {
            error: {
              message: 'Invalid API key',
              type: 'invalid_request_error',
              code: 'invalid_api_key'
            }
          });

        const response = await request(app)
          .post('/api/llm/estimate-calories')
          .send({
            description: 'apple',
            apiKey: 'invalid-key'
          });

        expect(response.status).toBe(401);
        expect(response.body.error).toContain('Invalid API key');
      });

      it('should handle 429 rate limit from OpenRouter', async () => {
        nock('https://openrouter.ai/api/v1')
          .post('/chat/completions')
          .reply(429, {
            error: {
              message: 'Rate limit exceeded',
              type: 'rate_limit_error',
              code: 'rate_limit_exceeded'
            }
          });

        const response = await request(app)
          .post('/api/llm/estimate-calories')
          .send({
            description: 'apple',
            apiKey: validApiKey
          });

        expect(response.status).toBe(429);
        expect(response.body.error).toBe('Rate limit exceeded');
      });

      it('should handle 500 server error from OpenRouter', async () => {
        nock('https://openrouter.ai/api/v1')
          .post('/chat/completions')
          .reply(500, {
            error: {
              message: 'Internal server error',
              type: 'server_error',
              code: 'internal_error'
            }
          });

        const response = await request(app)
          .post('/api/llm/estimate-calories')
          .send({
            description: 'apple',
            apiKey: validApiKey
          });

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Internal server error');
      });

      it('should handle malformed JSON response from OpenRouter', async () => {
        nock('https://openrouter.ai/api/v1')
          .post('/chat/completions')
          .reply(200, {
            id: 'chatcmpl-test-malformed',
            object: 'chat.completion',
            created: Date.now(),
            model: 'deepseek/deepseek-chat-v3.1:free',
            choices: [{
              index: 0,
              message: {
                role: 'assistant',
                content: 'This is not valid JSON for calorie estimation'
              },
              finish_reason: 'stop'
            }]
          });

        const response = await request(app)
          .post('/api/llm/estimate-calories')
          .send({
            description: 'apple',
            apiKey: validApiKey
          });

        expect(response.status).toBe(500);
        expect(response.body.error).toContain('Failed to parse calorie estimation');
      });

      it('should handle partial response with fallback parsing', async () => {
        nock('https://openrouter.ai/api/v1')
          .post('/chat/completions')
          .reply(200, {
            id: 'chatcmpl-test-partial',
            object: 'chat.completion',
            created: Date.now(),
            model: 'deepseek/deepseek-chat-v3.1:free',
            choices: [{
              index: 0,
              message: {
                role: 'assistant',
                content: 'The apple contains approximately 95 calories'
              },
              finish_reason: 'stop'
            }]
          });

        const response = await request(app)
          .post('/api/llm/estimate-calories')
          .send({
            description: 'apple',
            apiKey: validApiKey
          });

        expect(response.status).toBe(200);
        expect(response.body.calories).toBe(95);
        expect(response.body.confidence).toBe('low');
        expect(response.body.reasoning).toContain('partial response');
      });

      it('should handle network errors', async () => {
        nock('https://openrouter.ai/api/v1')
          .post('/chat/completions')
          .replyWithError('Network error');

        const response = await request(app)
          .post('/api/llm/estimate-calories')
          .send({
            description: 'apple',
            apiKey: validApiKey
          });

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Internal server error');
      });
    });

    describe('Request validation', () => {
      it('should validate negative values are converted to zero', async () => {
        nock('https://openrouter.ai/api/v1')
          .post('/chat/completions')
          .reply(200, {
            id: 'chatcmpl-test-negative',
            object: 'chat.completion',
            created: Date.now(),
            model: 'deepseek/deepseek-chat-v3.1:free',
            choices: [{
              index: 0,
              message: {
                role: 'assistant',
                content: JSON.stringify({
                  calories: -50,
                  protein: -2.0,
                  carbs: 25.0,
                  fat: -1.0,
                  confidence: 'high',
                  reasoning: 'Test with negative values'
                })
              },
              finish_reason: 'stop'
            }]
          });

        const response = await request(app)
          .post('/api/llm/estimate-calories')
          .send({
            description: 'test food',
            apiKey: validApiKey
          });

        expect(response.status).toBe(200);
        expect(response.body.calories).toBe(0);
        expect(response.body.protein).toBe(0);
        expect(response.body.fat).toBe(0);
        expect(response.body.carbs).toBe(25.0);
      });

      it('should validate confidence levels', async () => {
        nock('https://openrouter.ai/api/v1')
          .post('/chat/completions')
          .reply(200, {
            id: 'chatcmpl-test-invalid-confidence',
            object: 'chat.completion',
            created: Date.now(),
            model: 'deepseek/deepseek-chat-v3.1:free',
            choices: [{
              index: 0,
              message: {
                role: 'assistant',
                content: JSON.stringify({
                  calories: 100,
                  protein: 5.0,
                  carbs: 20.0,
                  fat: 2.0,
                  confidence: 'invalid',
                  reasoning: 'Test with invalid confidence'
                })
              },
              finish_reason: 'stop'
            }]
          });

        const response = await request(app)
          .post('/api/llm/estimate-calories')
          .send({
            description: 'test food',
            apiKey: validApiKey
          });

        expect(response.status).toBe(200);
        expect(response.body.calories).toBe(100);
        expect(response.body.confidence).toBe('low');
        expect(response.body.reasoning).toContain('partial response');
      });
    });
  });

  describe('GET /api/llm/models', () => {
    it('should return available models', async () => {
      const response = await request(app)
        .get('/api/llm/models');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const deepseekModel = response.body.find((model: { id: string; name: string }) => model.id === 'deepseek/deepseek-chat-v3.1:free');
      expect(deepseekModel).toBeDefined();
      expect(deepseekModel.name).toBe('DeepSeek V3.1 (Free)');
    });
  });
});