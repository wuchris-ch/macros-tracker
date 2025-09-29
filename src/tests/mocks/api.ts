// Types for API responses
export interface CalorieEstimationResponse {
  calories: number;
  confidence: number;
  reasoning: string;
}

export interface ApiError {
  error: string;
}

// Mock fetch responses - these will be used in individual test files
export const mockResponses = {
  calorieEstimationSuccess: (calories: number, confidence: number = 0.85): CalorieEstimationResponse => ({
    calories,
    confidence,
    reasoning: `Estimated ${calories} calories with ${confidence * 100}% confidence`
  }),

  calorieEstimationError: (message: string): ApiError => ({
    error: message
  }),

  networkError: new Error('Network error'),
};

// Common API endpoints
export const API_ENDPOINTS = {
  ESTIMATE_CALORIES: '/api/llm/estimate-calories',
  MEALS: '/api/meals',
} as const;

// Helper function to create mock fetch implementation
export const createMockFetch = (response: unknown, status: number = 200) => {
  return () => Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
  } as Response);
};

// Helper function to create mock fetch error
export const createMockFetchError = (error: Error) => {
  return () => Promise.reject(error);
};