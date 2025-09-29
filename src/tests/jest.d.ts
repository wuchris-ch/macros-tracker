/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

// This file ensures Jest globals are available in frontend test files
declare global {
  const describe: jest.Describe;
  const it: jest.It;
  const test: jest.It;
  const expect: jest.Expect;
  const beforeAll: jest.Lifecycle;
  const afterAll: jest.Lifecycle;
  const beforeEach: jest.Lifecycle;
  const afterEach: jest.Lifecycle;
}

export {};