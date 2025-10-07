import request from 'supertest';
import express from 'express';
import { llmRouter } from '../../src/routes/llm';
import nock from 'nock';

// Mock environment variables
process.env.OPENROUTER_API_KEY = 'test-api-key';

const app = express();
app.use(express.json());
app.use('/api/llm', llmRouter);

describe('LLM API Integration Tests', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('POST /api/llm/estimate-calories', () => {

    describe('Successful calorie estimation', () => {
      it('should estimate calories for a simple food description', async () => {
        // Mock successful OpenRouter response
        nock('https://openrouter.ai/api/v1')
          .post('/chat/completions')
          .reply(200, {
            id: 'chatcmpl-test-123',
            object: 'chat.completion',
            created: Date.now(),
            model: 'microsoft/mai-ds-r1:free',
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
            description: 'medium apple'
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
        nock('https://openrouter.ai/api/v1')
          .post('/chat/completions')
          .reply(200, {
            id: 'chatcmpl-test-456',
            object: 'chat.completion',
            created: Date.now(),
            model: 'microsoft/mai-ds-r1:free',
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
            description: 'Large Caesar salad with grilled chicken, croutons, and parmesan cheese'
          });

        expect(response.status).toBe(200);
        expect(response.body.calories).toBe(470);
        expect(response.body.confidence).toBe('medium');
        expect(response.body.protein).toBeGreaterThan(0);
        expect(response.body.carbs).toBeGreaterThan(0);
        expect(response.body.fat).toBeGreaterThan(0);
      });

      it('should handle model selection', async () => {
        nock('https://openrouter.ai/api/v1')
          .post('/chat/completions')
          .reply(200, {
            id: 'chatcmpl-test-model',
            object: 'chat.completion',
            created: Date.now(),
            model: 'deepseek/deepseek-r1:free',
            choices: [{
              index: 0,
              message: {
                role: 'assistant',
                content: JSON.stringify({
                  calories: 100,
                  protein: 5.0,
                  carbs: 20.0,
                  fat: 2.0,
                  confidence: 'high',
                  reasoning: 'Test with specific model selection'
                })
              },
              finish_reason: 'stop'
            }]
          });

        const response = await request(app)
          .post('/api/llm/estimate-calories')
          .send({
            description: 'test food',
            model: 'deepseek/deepseek-r1:free'
          });

        expect(response.status).toBe(200);
        expect(response.body.calories).toBe(100);
        expect(response.body.confidence).toBe('high');
      });
    });

    describe('Error handling', () => {
      it('should return 400 for missing description', async () => {
        const response = await request(app)
          .post('/api/llm/estimate-calories')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Missing required field');
      });

      it('should return 400 for empty description', async () => {
        const response = await request(app)
          .post('/api/llm/estimate-calories')
          .send({
            description: '   '
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Description cannot be empty');
      });

      it('should return 500 for missing API key configuration', async () => {
        // Temporarily remove API key
        const originalApiKey = process.env.OPENROUTER_API_KEY;
        delete process.env.OPENROUTER_API_KEY;

        const response = await request(app)
          .post('/api/llm/estimate-calories')
          .send({
            description: 'apple'
          });

        expect(response.status).toBe(500);
        expect(response.body.error).toContain('Server configuration error');

        // Restore API key
        process.env.OPENROUTER_API_KEY = originalApiKey;
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
            description: 'apple'
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
            description: 'apple'
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
            description: 'apple'
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
            model: 'microsoft/mai-ds-r1:free',
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
            description: 'apple'
          });

        expect(response.status).toBe(500);
        expect(response.body.error).toContain('Failed to parse calorie estimation');
      });

      it('should handle network errors', async () => {
        nock('https://openrouter.ai/api/v1')
          .post('/chat/completions')
          .replyWithError('Network error');

        const response = await request(app)
          .post('/api/llm/estimate-calories')
          .send({
            description: 'apple'
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
            model: 'microsoft/mai-ds-r1:free',
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
            description: 'test food'
          });

        expect(response.status).toBe(200);
        expect(response.body.calories).toBe(0);
        expect(response.body.protein).toBe(0);
        expect(response.body.fat).toBe(0);
        expect(response.body.carbs).toBe(25.0);
      });
    });
  });

  describe('GET /api/llm/models', () => {
    it('should return available models', async () => {
      const response = await request(app)
        .get('/api/llm/models');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(4);
      
      const microsoftModel = response.body.find((model: { id: string; name: string }) => model.id === 'microsoft/mai-ds-r1:free');
      expect(microsoftModel).toBeDefined();
      expect(microsoftModel.name).toBe('Microsoft MAI DS R1 (Free)');
      expect(microsoftModel.recommended).toBe(true);
      
      const deepseekModel = response.body.find((model: { id: string; name: string }) => model.id === 'deepseek/deepseek-r1:free');
      expect(deepseekModel).toBeDefined();
      expect(deepseekModel.name).toBe('DeepSeek R1 (Free)');
      expect(deepseekModel.recommended).toBe(true);
    });
  });
});