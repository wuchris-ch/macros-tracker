// Mock props for MealDialog component
export const mockMealDialogProps = {
  open: true,
  onOpenChange: () => {},
  selectedDate: new Date('2024-01-15'),
  onMealAdded: () => {},
};

// Mock meal data
export const mockMeal = {
  id: 1,
  date: '2024-01-15',
  description: '2 slices of whole wheat bread with peanut butter',
  calories: 320,
  confidence: 0.85,
  reasoning: 'Based on typical serving sizes, this meal contains approximately 320 calories.',
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
};

// Mock meals array for testing lists
export const mockMeals = [
  mockMeal,
  {
    id: 2,
    date: '2024-01-15',
    description: '1 medium apple',
    calories: 95,
    confidence: 0.9,
    reasoning: 'A medium apple typically contains about 95 calories.',
    created_at: '2024-01-15T14:15:00Z',
    updated_at: '2024-01-15T14:15:00Z',
  },
  {
    id: 3,
    date: '2024-01-15',
    description: 'Large Caesar salad with grilled chicken',
    calories: 470,
    confidence: 0.75,
    reasoning: 'Caesar salad with chicken varies but typically around 470 calories.',
    created_at: '2024-01-15T19:45:00Z',
    updated_at: '2024-01-15T19:45:00Z',
  },
];

// Mock form data for testing
export const mockFormData = {
  validDescription: '2 slices of whole wheat bread with peanut butter',
  emptyDescription: '',
  longDescription: 'A very long description that exceeds normal limits and contains many details about the food item including ingredients, preparation method, and serving size information that goes on and on',
  ambiguousDescription: 'pasta',
  invalidDescription: '!@#$%^&*()',
};

// Mock user interactions
export const mockUserEvents = {
  typeInTextarea: (element: HTMLElement, text: string) => ({
    target: element,
    type: 'change',
    value: text,
  }),
  clickButton: (element: HTMLElement) => ({
    target: element,
    type: 'click',
  }),
  submitForm: (element: HTMLElement) => ({
    target: element,
    type: 'submit',
  }),
};

// Mock component states
export const mockComponentStates = {
  loading: {
    isLoading: true,
    error: null,
    data: null,
  },
  success: {
    isLoading: false,
    error: null,
    data: mockMeal,
  },
  error: {
    isLoading: false,
    error: 'Failed to estimate calories',
    data: null,
  },
  idle: {
    isLoading: false,
    error: null,
    data: null,
  },
};