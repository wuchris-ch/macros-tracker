import { MockOpenRouterResponse } from '../mocks/openrouter';

export const successfulCalorieResponse: MockOpenRouterResponse = {
  id: 'chatcmpl-test-success',
  object: 'chat.completion',
  created: 1699123456,
  model: 'anthropic/claude-3.5-sonnet',
  choices: [{
    index: 0,
    message: {
      role: 'assistant',
      content: JSON.stringify({
        calories: 320,
        confidence: 0.85,
        reasoning: 'Based on the description "2 slices of whole wheat bread with peanut butter", this appears to be a typical serving with approximately 320 calories.'
      })
    },
    finish_reason: 'stop'
  }],
  usage: {
    prompt_tokens: 150,
    completion_tokens: 45,
    total_tokens: 195
  }
};

export const lowConfidenceResponse: MockOpenRouterResponse = {
  id: 'chatcmpl-test-low-confidence',
  object: 'chat.completion',
  created: 1699123456,
  model: 'anthropic/claude-3.5-sonnet',
  choices: [{
    index: 0,
    message: {
      role: 'assistant',
      content: JSON.stringify({
        calories: 250,
        confidence: 0.3,
        reasoning: 'The description "pasta" is very vague. Could range from 200-800 calories depending on portion size, sauce, and ingredients.'
      })
    },
    finish_reason: 'stop'
  }],
  usage: {
    prompt_tokens: 120,
    completion_tokens: 40,
    total_tokens: 160
  }
};

export const errorResponses = {
  invalidApiKey: {
    error: {
      message: 'Invalid API key provided',
      type: 'invalid_request_error',
      code: 'invalid_api_key'
    }
  },
  rateLimitExceeded: {
    error: {
      message: 'Rate limit exceeded. Please try again later.',
      type: 'rate_limit_error',
      code: 'rate_limit_exceeded'
    }
  },
  serverError: {
    error: {
      message: 'The server encountered an error while processing your request',
      type: 'server_error',
      code: 'internal_error'
    }
  },
  modelOverloaded: {
    error: {
      message: 'The model is currently overloaded. Please try again later.',
      type: 'server_error',
      code: 'model_overloaded'
    }
  }
};

export const malformedResponses = {
  invalidJson: {
    id: 'chatcmpl-test-invalid',
    object: 'chat.completion',
    created: 1699123456,
    model: 'anthropic/claude-3.5-sonnet',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: 'This is not valid JSON'
      },
      finish_reason: 'stop'
    }]
  },
  missingFields: {
    id: 'chatcmpl-test-missing',
    object: 'chat.completion',
    created: 1699123456,
    model: 'anthropic/claude-3.5-sonnet',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: JSON.stringify({
          calories: 200
          // Missing confidence and reasoning
        })
      },
      finish_reason: 'stop'
    }]
  },
  emptyContent: {
    id: 'chatcmpl-test-empty',
    object: 'chat.completion',
    created: 1699123456,
    model: 'anthropic/claude-3.5-sonnet',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: ''
      },
      finish_reason: 'stop'
    }]
  }
};