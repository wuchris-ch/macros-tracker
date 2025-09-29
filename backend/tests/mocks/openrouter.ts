import nock from 'nock';

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export interface MockOpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterMock {
  private scope: nock.Scope;

  constructor() {
    this.scope = nock(OPENROUTER_BASE_URL);
  }

  mockSuccessfulCalorieEstimation(foodDescription: string, calories: number, confidence: number = 0.85) {
    const response: MockOpenRouterResponse = {
      id: 'chatcmpl-test-123',
      object: 'chat.completion',
      created: Date.now(),
      model: 'anthropic/claude-3.5-sonnet',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: JSON.stringify({
            calories,
            confidence,
            reasoning: `Based on the description "${foodDescription}", this appears to be a typical serving with approximately ${calories} calories.`
          })
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 150,
        completion_tokens: 50,
        total_tokens: 200
      }
    };

    return this.scope
      .post('/chat/completions')
      .reply(200, response);
  }

  mockInvalidApiKey() {
    return this.scope
      .post('/chat/completions')
      .reply(401, {
        error: {
          message: 'Invalid API key',
          type: 'invalid_request_error',
          code: 'invalid_api_key'
        }
      });
  }

  mockRateLimitError() {
    return this.scope
      .post('/chat/completions')
      .reply(429, {
        error: {
          message: 'Rate limit exceeded',
          type: 'rate_limit_error',
          code: 'rate_limit_exceeded'
        }
      });
  }

  mockServerError() {
    return this.scope
      .post('/chat/completions')
      .reply(500, {
        error: {
          message: 'Internal server error',
          type: 'server_error',
          code: 'internal_error'
        }
      });
  }

  mockMalformedResponse() {
    return this.scope
      .post('/chat/completions')
      .reply(200, {
        id: 'chatcmpl-test-123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'anthropic/claude-3.5-sonnet',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: 'This is not valid JSON for calorie estimation'
          },
          finish_reason: 'stop'
        }]
      });
  }

  mockNetworkError() {
    return this.scope
      .post('/chat/completions')
      .replyWithError('Network error');
  }

  cleanup() {
    nock.cleanAll();
  }
}

// Helper function to create a fresh mock instance
export const createOpenRouterMock = () => new OpenRouterMock();

// Note: Call nock.cleanAll() in your test files' afterEach hooks