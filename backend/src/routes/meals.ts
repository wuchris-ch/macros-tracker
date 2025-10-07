import express from 'express';
import { Database } from '../database';

const router = express.Router();
const db = new Database();

// GET /api/meals/export - Export all data in CSV or JSON format
router.get('/export', async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    if (format !== 'json' && format !== 'csv') {
      return res.status(400).json({ error: 'Invalid format. Use "json" or "csv"' });
    }

    const [meals, dailyTotals] = await Promise.all([
      db.getAllMeals(),
      db.getAllDailyTotals()
    ]);

    const exportData = {
      meals,
      dailyTotals,
      exportDate: new Date().toISOString(),
      totalMeals: meals.length,
      totalDays: dailyTotals.length,
      dateRange: dailyTotals.length > 0 ? {
        start: dailyTotals[0].date,
        end: dailyTotals[dailyTotals.length - 1].date
      } : null
    };

    if (format === 'csv') {
      // Convert meals to CSV
      const mealsCsv = convertMealsToCSV(meals);
      const totalsCsv = convertDailyTotalsToCSV(dailyTotals);
      
      const csvContent = `# Calorie Tracker Export - ${new Date().toISOString()}
# Total Meals: ${meals.length}
# Total Days: ${dailyTotals.length}
# Date Range: ${exportData.dateRange?.start || 'N/A'} to ${exportData.dateRange?.end || 'N/A'}

# MEALS DATA
${mealsCsv}

# DAILY TOTALS DATA
${totalsCsv}`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="calorie-tracker-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="calorie-tracker-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to convert meals to CSV
function convertMealsToCSV(meals: any[]): string {
  if (meals.length === 0) return 'No meals found';
  
  const headers = ['ID', 'Date', 'Name', 'Description', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)', 'Created At', 'Updated At'];
  const csvRows = [headers.join(',')];
  
  meals.forEach(meal => {
    const row = [
      meal.id || '',
      meal.date || '',
      `"${(meal.name || '').replace(/"/g, '""')}"`,
      `"${(meal.description || '').replace(/"/g, '""')}"`,
      meal.calories || 0,
      meal.protein || 0,
      meal.carbs || 0,
      meal.fat || 0,
      meal.created_at || '',
      meal.updated_at || ''
    ];
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
}

// Helper function to convert daily totals to CSV
function convertDailyTotalsToCSV(totals: any[]): string {
  if (totals.length === 0) return 'No daily totals found';
  
  const headers = ['Date', 'Total Calories', 'Total Protein (g)', 'Total Carbs (g)', 'Total Fat (g)', 'Meal Count'];
  const csvRows = [headers.join(',')];
  
  totals.forEach(total => {
    const row = [
      total.date || '',
      total.total_calories || 0,
      total.total_protein || 0,
      total.total_carbs || 0,
      total.total_fat || 0,
      total.meal_count || 0
    ];
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
}

// GET /api/meals/stats - Get all-time stats with optional date range filtering
// IMPORTANT: This route must come BEFORE /:date to avoid matching "stats" as a date
router.get('/stats', async (req, res) => {
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
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/meals/totals/:startDate/:endDate - Get daily totals for date range
router.get('/totals/:startDate/:endDate', async (req, res) => {
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
    console.error('Error fetching daily totals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/meals/:date - Get all meals for a specific date
router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const meals = await db.getMealsByDate(date);
    res.json(meals);
  } catch (error) {
    console.error('Error fetching meals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/meals - Add a new meal
router.post('/', async (req, res) => {
  try {
    const { date, name, description, calories, protein, carbs, fat } = req.body;

    // Validate required fields
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

    // Validate calories is a positive number
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
    console.error('Error adding meal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/meals/:id - Update a meal
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, name, description, calories, protein, carbs, fat } = req.body;

    // Validate ID is a number
    const mealId = parseInt(id);
    if (isNaN(mealId)) {
      return res.status(400).json({ error: 'Invalid meal ID' });
    }

    // Check if meal exists
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
    console.error('Error updating meal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/meals/:id - Delete a meal
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID is a number
    const mealId = parseInt(id);
    if (isNaN(mealId)) {
      return res.status(400).json({ error: 'Invalid meal ID' });
    }

    // Check if meal exists
    const existingMeal = await db.getMealById(mealId);
    if (!existingMeal) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    await db.deleteMeal(mealId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting meal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as mealsRouter };