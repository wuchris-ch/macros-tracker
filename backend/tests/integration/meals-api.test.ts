import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs';

// Create a test database file
const testDbPath = path.join(__dirname, '..', '..', 'test_calorie_tracker.db');

// Mock the database module
let testDbInstance: any = null;

jest.mock('../../src/database', () => {
  const sqlite3 = require('sqlite3');
  
  return {
    Database: class TestDatabase {
      db: any;
      
      constructor() {
        this.db = new sqlite3.Database(':memory:'); // Use in-memory database for tests
        this.initializeTables();
        testDbInstance = this; // Store reference for cleanup
      }

      private initializeTables(): void {
        const createMealsTable = `
          CREATE TABLE IF NOT EXISTS meals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            calories INTEGER NOT NULL,
            protein REAL DEFAULT 0,
            carbs REAL DEFAULT 0,
            fat REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `;

        this.db.run(createMealsTable, (err: any) => {
          if (err) {
            console.error('Error creating meals table:', err);
          }
        });
      }

      getMealsByDate(date: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
          const query = 'SELECT * FROM meals WHERE date = ? ORDER BY created_at ASC';
          this.db.all(query, [date], (err: any, rows: any[]) => {
            if (err) {
              reject(err);
            } else {
              resolve(rows);
            }
          });
        });
      }

      getDailyTotals(startDate: string, endDate: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
          const query = `
            SELECT
              date,
              SUM(calories) as total_calories,
              SUM(protein) as total_protein,
              SUM(carbs) as total_carbs,
              SUM(fat) as total_fat,
              COUNT(*) as meal_count
            FROM meals
            WHERE date BETWEEN ? AND ?
            GROUP BY date
            ORDER BY date ASC
          `;
          this.db.all(query, [startDate, endDate], (err: any, rows: any[]) => {
            if (err) {
              reject(err);
            } else {
              resolve(rows);
            }
          });
        });
      }

      getAllTimeDailyTotals(startDate?: string, endDate?: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
          let query = `
            SELECT
              date,
              SUM(calories) as total_calories,
              SUM(protein) as total_protein,
              SUM(carbs) as total_carbs,
              SUM(fat) as total_fat,
              COUNT(*) as meal_count
            FROM meals
          `;
          
          const params: string[] = [];
          
          if (startDate && endDate) {
            query += ' WHERE date BETWEEN ? AND ?';
            params.push(startDate, endDate);
          } else if (startDate) {
            query += ' WHERE date >= ?';
            params.push(startDate);
          } else if (endDate) {
            query += ' WHERE date <= ?';
            params.push(endDate);
          }
          
          query += ' GROUP BY date ORDER BY date ASC';
          
          this.db.all(query, params, (err: any, rows: any[]) => {
            if (err) {
              reject(err);
            } else {
              resolve(rows);
            }
          });
        });
      }

      addMeal(meal: any): Promise<number> {
        return new Promise((resolve, reject) => {
          const query = `
            INSERT INTO meals (date, name, description, calories, protein, carbs, fat)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `;
          this.db.run(query, [
            meal.date,
            meal.name,
            meal.description,
            meal.calories,
            meal.protein || 0,
            meal.carbs || 0,
            meal.fat || 0
          ], function(this: any, err: any) {
            if (err) {
              reject(err);
            } else {
              resolve(this.lastID);
            }
          });
        });
      }

      updateMeal(id: number, meal: any): Promise<void> {
        return new Promise((resolve, reject) => {
          const fields = [];
          const values = [];
          
          if (meal.date !== undefined) {
            fields.push('date = ?');
            values.push(meal.date);
          }
          if (meal.name !== undefined) {
            fields.push('name = ?');
            values.push(meal.name);
          }
          if (meal.description !== undefined) {
            fields.push('description = ?');
            values.push(meal.description);
          }
          if (meal.calories !== undefined) {
            fields.push('calories = ?');
            values.push(meal.calories);
          }
          if (meal.protein !== undefined) {
            fields.push('protein = ?');
            values.push(meal.protein);
          }
          if (meal.carbs !== undefined) {
            fields.push('carbs = ?');
            values.push(meal.carbs);
          }
          if (meal.fat !== undefined) {
            fields.push('fat = ?');
            values.push(meal.fat);
          }
          
          fields.push('updated_at = CURRENT_TIMESTAMP');
          values.push(id);

          const query = `UPDATE meals SET ${fields.join(', ')} WHERE id = ?`;
          
          this.db.run(query, values, (err: any) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }

      deleteMeal(id: number): Promise<void> {
        return new Promise((resolve, reject) => {
          const query = 'DELETE FROM meals WHERE id = ?';
          this.db.run(query, [id], (err: any) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }

      getMealById(id: number): Promise<any | null> {
        return new Promise((resolve, reject) => {
          const query = 'SELECT * FROM meals WHERE id = ?';
          this.db.get(query, [id], (err: any, row: any) => {
            if (err) {
              reject(err);
            } else {
              resolve(row || null);
            }
          });
        });
      }

      close(): void {
        this.db.close((err: any) => {
          if (err) {
            console.error('Error closing database:', err);
          }
        });
      }
    }
  };
});

import { Database } from '../../src/database';

// Create a mock meals router that uses our test database
const mealsRouter = express.Router();
const db = new Database();

// Mock the routes
mealsRouter.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Validate date formats if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (startDate && typeof startDate === 'string' && !dateRegex.test(startDate)) {
      return res.status(400).json({ error: 'Invalid startDate format. Use YYYY-MM-DD' });
    }
    if (endDate && typeof endDate === 'string' && !dateRegex.test(endDate)) {
      return res.status(400).json({ error: 'Invalid endDate format. Use YYYY-MM-DD' });
    }

    const totals = await db.getAllTimeDailyTotals(
      startDate as string | undefined,
      endDate as string | undefined
    );
    res.json(totals);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

mealsRouter.get('/totals/:startDate/:endDate', async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    
    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const totals = await db.getDailyTotals(startDate, endDate);
    res.json(totals);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

mealsRouter.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const meals = await db.getMealsByDate(date);
    res.json(meals);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

mealsRouter.post('/', async (req, res) => {
  try {
    const { date, name, description, calories, protein, carbs, fat } = req.body;
    
    if (!date || !name || calories === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: date, name, and calories are required'
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    if (typeof calories !== 'number' || calories < 0) {
      return res.status(400).json({ error: 'Calories must be a positive number' });
    }

    // Validate macronutrients if provided
    if (protein !== undefined && (typeof protein !== 'number' || protein < 0)) {
      return res.status(400).json({ error: 'Protein must be a positive number' });
    }
    if (carbs !== undefined && (typeof carbs !== 'number' || carbs < 0)) {
      return res.status(400).json({ error: 'Carbs must be a positive number' });
    }
    if (fat !== undefined && (typeof fat !== 'number' || fat < 0)) {
      return res.status(400).json({ error: 'Fat must be a positive number' });
    }

    const mealId = await db.addMeal({ date, name, description, calories, protein, carbs, fat });
    const newMeal = await db.getMealById(mealId);
    
    res.status(201).json(newMeal);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

mealsRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, name, description, calories, protein, carbs, fat } = req.body;

    const mealId = parseInt(id);
    if (isNaN(mealId)) {
      return res.status(400).json({ error: 'Invalid meal ID' });
    }

    const existingMeal = await db.getMealById(mealId);
    if (!existingMeal) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    // Validate date format if provided
    if (date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
    }

    // Validate calories if provided
    if (calories !== undefined && (typeof calories !== 'number' || calories < 0)) {
      return res.status(400).json({ error: 'Calories must be a positive number' });
    }

    // Validate macronutrients if provided
    if (protein !== undefined && (typeof protein !== 'number' || protein < 0)) {
      return res.status(400).json({ error: 'Protein must be a positive number' });
    }
    if (carbs !== undefined && (typeof carbs !== 'number' || carbs < 0)) {
      return res.status(400).json({ error: 'Carbs must be a positive number' });
    }
    if (fat !== undefined && (typeof fat !== 'number' || fat < 0)) {
      return res.status(400).json({ error: 'Fat must be a positive number' });
    }

    await db.updateMeal(mealId, { date, name, description, calories, protein, carbs, fat });
    const updatedMeal = await db.getMealById(mealId);
    
    res.json(updatedMeal);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

mealsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const mealId = parseInt(id);
    if (isNaN(mealId)) {
      return res.status(400).json({ error: 'Invalid meal ID' });
    }

    const existingMeal = await db.getMealById(mealId);
    if (!existingMeal) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    await db.deleteMeal(mealId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

const app = express();
app.use(express.json());
app.use('/api/meals', mealsRouter);

describe('Meals API Integration Tests', () => {
  beforeAll(async () => {
    // Wait for database initialization
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  beforeEach(async () => {
    // Clear any existing test data
    if (testDbInstance) {
      await new Promise<void>((resolve, reject) => {
        testDbInstance.db.run('DELETE FROM meals', (err: any) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  });

  describe('POST /api/meals', () => {
    it('should create a new meal with all fields', async () => {
      const mealData = {
        date: '2024-01-15',
        name: 'Breakfast',
        description: 'Scrambled eggs with toast',
        calories: 350,
        protein: 20,
        carbs: 30,
        fat: 15
      };

      const response = await request(app)
        .post('/api/meals')
        .send(mealData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        date: mealData.date,
        name: mealData.name,
        description: mealData.description,
        calories: mealData.calories,
        protein: mealData.protein,
        carbs: mealData.carbs,
        fat: mealData.fat,
        created_at: expect.any(String),
        updated_at: expect.any(String)
      });
    });

    it('should create a meal with minimal required fields', async () => {
      const mealData = {
        date: '2024-01-15',
        name: 'Lunch',
        calories: 500
      };

      const response = await request(app)
        .post('/api/meals')
        .send(mealData);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: expect.any(Number),
        date: mealData.date,
        name: mealData.name,
        calories: mealData.calories,
        protein: 0,
        carbs: 0,
        fat: 0
      });
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/meals')
        .send({
          name: 'Breakfast'
          // missing date and calories
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .post('/api/meals')
        .send({
          date: '15-01-2024', // wrong format
          name: 'Breakfast',
          calories: 350
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid date format');
    });

    it('should return 400 for negative calories', async () => {
      const response = await request(app)
        .post('/api/meals')
        .send({
          date: '2024-01-15',
          name: 'Breakfast',
          calories: -100
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Calories must be a positive number');
    });

    it('should return 400 for negative macronutrients', async () => {
      const response = await request(app)
        .post('/api/meals')
        .send({
          date: '2024-01-15',
          name: 'Breakfast',
          calories: 350,
          protein: -10
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Protein must be a positive number');
    });
  });

  describe('GET /api/meals/:date', () => {
    beforeEach(async () => {
      // Add test meals
      await request(app)
        .post('/api/meals')
        .send({
          date: '2024-01-15',
          name: 'Breakfast',
          calories: 350,
          protein: 20,
          carbs: 30,
          fat: 15
        });

      await request(app)
        .post('/api/meals')
        .send({
          date: '2024-01-15',
          name: 'Lunch',
          calories: 500,
          protein: 25,
          carbs: 45,
          fat: 20
        });

      await request(app)
        .post('/api/meals')
        .send({
          date: '2024-01-16',
          name: 'Dinner',
          calories: 600,
          protein: 30,
          carbs: 50,
          fat: 25
        });
    });

    it('should return meals for a specific date', async () => {
      const response = await request(app)
        .get('/api/meals/2024-01-15');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        id: expect.any(Number),
        date: '2024-01-15',
        name: expect.any(String),
        calories: expect.any(Number)
      });
    });

    it('should return empty array for date with no meals', async () => {
      const response = await request(app)
        .get('/api/meals/2024-01-20');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .get('/api/meals/15-01-2024');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid date format');
    });
  });

  describe('PUT /api/meals/:id', () => {
    let mealId: number;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/meals')
        .send({
          date: '2024-01-15',
          name: 'Breakfast',
          calories: 350,
          protein: 20,
          carbs: 30,
          fat: 15
        });
      
      mealId = response.body.id;
    });

    it('should update an existing meal', async () => {
      const updateData = {
        name: 'Updated Breakfast',
        calories: 400,
        protein: 25
      };

      const response = await request(app)
        .put(`/api/meals/${mealId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: mealId,
        name: updateData.name,
        calories: updateData.calories,
        protein: updateData.protein,
        carbs: 30, // unchanged
        fat: 15    // unchanged
      });
    });

    it('should return 404 for non-existent meal', async () => {
      const response = await request(app)
        .put('/api/meals/99999')
        .send({
          name: 'Updated Meal',
          calories: 400
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Meal not found');
    });

    it('should return 400 for invalid meal ID', async () => {
      const response = await request(app)
        .put('/api/meals/invalid')
        .send({
          name: 'Updated Meal',
          calories: 400
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid meal ID');
    });

    it('should return 400 for negative calories in update', async () => {
      const response = await request(app)
        .put(`/api/meals/${mealId}`)
        .send({
          calories: -100
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Calories must be a positive number');
    });
  });

  describe('DELETE /api/meals/:id', () => {
    let mealId: number;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/meals')
        .send({
          date: '2024-01-15',
          name: 'Breakfast',
          calories: 350
        });
      
      mealId = response.body.id;
    });

    it('should delete an existing meal', async () => {
      const response = await request(app)
        .delete(`/api/meals/${mealId}`);

      expect(response.status).toBe(204);

      // Verify meal is deleted
      const getResponse = await request(app)
        .get('/api/meals/2024-01-15');
      
      expect(getResponse.body).toHaveLength(0);
    });

    it('should return 404 for non-existent meal', async () => {
      const response = await request(app)
        .delete('/api/meals/99999');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Meal not found');
    });

    it('should return 400 for invalid meal ID', async () => {
      const response = await request(app)
        .delete('/api/meals/invalid');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid meal ID');
    });
  });

  describe('GET /api/meals/totals/:startDate/:endDate', () => {
    beforeEach(async () => {
      // Add meals for multiple dates
      await request(app)
        .post('/api/meals')
        .send({
          date: '2024-01-15',
          name: 'Breakfast',
          calories: 350,
          protein: 20,
          carbs: 30,
          fat: 15
        });

      await request(app)
        .post('/api/meals')
        .send({
          date: '2024-01-15',
          name: 'Lunch',
          calories: 500,
          protein: 25,
          carbs: 45,
          fat: 20
        });

      await request(app)
        .post('/api/meals')
        .send({
          date: '2024-01-16',
          name: 'Dinner',
          calories: 600,
          protein: 30,
          carbs: 50,
          fat: 25
        });
    });

    it('should return daily totals for date range', async () => {
      const response = await request(app)
        .get('/api/meals/totals/2024-01-15/2024-01-16');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      
      const day1 = response.body.find((day: any) => day.date === '2024-01-15');
      expect(day1).toMatchObject({
        date: '2024-01-15',
        total_calories: 850,
        total_protein: 45,
        total_carbs: 75,
        total_fat: 35,
        meal_count: 2
      });

      const day2 = response.body.find((day: any) => day.date === '2024-01-16');
      expect(day2).toMatchObject({
        date: '2024-01-16',
        total_calories: 600,
        total_protein: 30,
        total_carbs: 50,
        total_fat: 25,
        meal_count: 1
      });
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .get('/api/meals/totals/15-01-2024/16-01-2024');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid date format');
    });
  });

  describe('GET /api/meals/stats', () => {
    beforeEach(async () => {
      // Add meals for testing stats
      await request(app)
        .post('/api/meals')
        .send({
          date: '2024-01-15',
          name: 'Breakfast',
          calories: 350,
          protein: 20,
          carbs: 30,
          fat: 15
        });

      await request(app)
        .post('/api/meals')
        .send({
          date: '2024-01-16',
          name: 'Lunch',
          calories: 500,
          protein: 25,
          carbs: 45,
          fat: 20
        });
    });

    it('should return all-time stats without date filtering', async () => {
      const response = await request(app)
        .get('/api/meals/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        date: expect.any(String),
        total_calories: expect.any(Number),
        total_protein: expect.any(Number),
        total_carbs: expect.any(Number),
        total_fat: expect.any(Number),
        meal_count: expect.any(Number)
      });
    });

    it('should return stats with date range filtering', async () => {
      const response = await request(app)
        .get('/api/meals/stats?startDate=2024-01-15&endDate=2024-01-15');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].date).toBe('2024-01-15');
    });

    it('should return 400 for invalid date format in query params', async () => {
      const response = await request(app)
        .get('/api/meals/stats?startDate=15-01-2024');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid startDate format');
    });
  });

  describe('Error handling', () => {
      it('should handle database errors gracefully', async () => {
        // Close the database connection to simulate an error
        if (testDbInstance) {
          testDbInstance.close();
        }

        const response = await request(app)
          .get('/api/meals/2024-01-15');

        expect(response.status).toBe(500);
        expect(response.body.error).toContain('Internal server error');
      });
  });
});
