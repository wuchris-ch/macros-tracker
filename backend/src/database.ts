import sqlite3 from 'sqlite3';
import path from 'path';

export interface Meal {
  id?: number;
  date: string; // YYYY-MM-DD format
  name: string;
  description?: string;
  calories: number;
  protein?: number; // grams
  carbs?: number; // grams
  fat?: number; // grams
  created_at?: string;
  updated_at?: string;
}

export interface DailyTotal {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  meal_count: number;
}

export class Database {
  private db: sqlite3.Database;

  constructor() {
    const dbPath = path.join(__dirname, '..', 'calorie_tracker.db');
    this.db = new sqlite3.Database(dbPath);
    this.initializeTables();
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

    // Add columns to existing table if they don't exist
    const addProteinColumn = `ALTER TABLE meals ADD COLUMN protein REAL DEFAULT 0`;
    const addCarbsColumn = `ALTER TABLE meals ADD COLUMN carbs REAL DEFAULT 0`;
    const addFatColumn = `ALTER TABLE meals ADD COLUMN fat REAL DEFAULT 0`;

    this.db.run(createMealsTable, (err) => {
      if (err) {
        console.error('Error creating meals table:', err);
      } else {
        console.log('Meals table initialized successfully');
        
        // Add new columns if they don't exist (for existing databases)
        this.db.run(addProteinColumn, () => {});
        this.db.run(addCarbsColumn, () => {});
        this.db.run(addFatColumn, () => {});
      }
    });
  }

  // Get all meals for a specific date
  getMealsByDate(date: string): Promise<Meal[]> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM meals WHERE date = ? ORDER BY created_at ASC';
      this.db.all(query, [date], (err, rows: Meal[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get daily totals for a date range (for calendar view)
  getDailyTotals(startDate: string, endDate: string): Promise<DailyTotal[]> {
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
      this.db.all(query, [startDate, endDate], (err, rows: DailyTotal[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get all-time daily totals with optional date range filtering
  getAllTimeDailyTotals(startDate?: string, endDate?: string): Promise<DailyTotal[]> {
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
      
      this.db.all(query, params, (err, rows: DailyTotal[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Add a new meal
  addMeal(meal: Omit<Meal, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
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
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  // Update a meal
  updateMeal(id: number, meal: Partial<Omit<Meal, 'id' | 'created_at'>>): Promise<void> {
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
      
      this.db.run(query, values, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Delete a meal
  deleteMeal(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM meals WHERE id = ?';
      this.db.run(query, [id], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // Get a single meal by ID
  getMealById(id: number): Promise<Meal | null> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM meals WHERE id = ?';
      this.db.get(query, [id], (err, row: Meal) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  // Get all meals for export
  getAllMeals(): Promise<Meal[]> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM meals ORDER BY date ASC, created_at ASC';
      this.db.all(query, [], (err, rows: Meal[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get all daily totals for export
  getAllDailyTotals(): Promise<DailyTotal[]> {
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
        GROUP BY date
        ORDER BY date ASC
      `;
      this.db.all(query, [], (err, rows: DailyTotal[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Close database connection
  close(): void {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}