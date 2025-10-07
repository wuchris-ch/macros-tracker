import { createOpenRouterMock } from '../mocks/openrouter';
import { validFoodDescriptions } from '../fixtures/food-descriptions';

describe('Test Infrastructure', () => {
  it('should have Jest configured correctly', () => {
    expect(true).toBe(true);
  });

  it('should have environment variables set for testing', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.OPENROUTER_API_KEY).toBe('test-api-key');
  });

  it('should be able to import test utilities', () => {
    expect(createOpenRouterMock).toBeDefined();
    expect(typeof createOpenRouterMock).toBe('function');
  });

  it('should be able to import test fixtures', () => {
    expect(validFoodDescriptions).toBeDefined();
    expect(Array.isArray(validFoodDescriptions)).toBe(true);
    expect(validFoodDescriptions.length).toBeGreaterThan(0);
  });
});
