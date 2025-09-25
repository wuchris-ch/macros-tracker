# Calorie Tracker App - Implementation Plan

## 📋 Requirements Analysis

Based on the original requirements, we needed to build:

1. **Calendar-like app** with daily calorie tracking
2. **Multiple meal inputs per day** (meal 1, meal 2, etc.) with renaming capability
3. **Two input methods:**
   - Direct calorie input
   - AI-powered calorie estimation from food descriptions
4. **LLM Integration** with OpenAI-compatible API (https://proxy.fuelix.ai)
5. **Model selection** for different AI models
6. **Simple database** for long-term data storage
7. **User-provided API key** functionality
8. **shadcn/ui** for frontend components

## 🏗️ Architecture Overview

### Technology Stack
- **Frontend:** Next.js 15 with TypeScript
- **UI Library:** shadcn/ui components with Tailwind CSS
- **Backend:** Express.js with TypeScript
- **Database:** SQLite for simple, local data persistence
- **AI Integration:** OpenAI-compatible API via proxy.fuelix.ai
- **Date Handling:** date-fns library

### Project Structure
```
calorie-tracker/
├── src/                          # Next.js frontend
│   ├── app/
│   │   └── page.tsx             # Main application page
│   ├── components/
│   │   ├── CalendarView.tsx     # Monthly calendar with daily totals
│   │   ├── DayView.tsx          # Daily meal management interface
│   │   ├── MealDialog.tsx       # Add/edit meal dialog with AI estimation
│   │   ├── SettingsDialog.tsx   # API key and model configuration
│   │   └── ui/                  # shadcn/ui components
│   └── lib/
│       └── utils.ts             # Utility functions
├── backend/                      # Express.js API server
│   ├── src/
│   │   ├── server.ts            # Main server file
│   │   ├── database.ts          # SQLite database operations
│   │   └── routes/
│   │       ├── meals.ts         # CRUD operations for meals
│   │       └── llm.ts           # AI calorie estimation endpoint
│   └── calorie_tracker.db       # SQLite database file
└── components.json               # shadcn/ui configuration
```

## 🎯 Implementation Steps

### Phase 1: Project Setup
1. **Initialize Next.js project** with TypeScript, Tailwind CSS, and ESLint
2. **Configure shadcn/ui** with neutral color scheme
3. **Install required shadcn components:**
   - Calendar, Button, Input, Dialog, Form
   - Card, Select, Textarea, Tabs, Label
4. **Set up Express.js backend** with TypeScript configuration
5. **Install backend dependencies:** express, cors, sqlite3, axios, dotenv

### Phase 2: Database Design
```sql
-- SQLite Schema
CREATE TABLE meals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,              -- YYYY-MM-DD format
  name TEXT NOT NULL,              -- Meal name (renameable)
  description TEXT,                -- Optional food description
  calories INTEGER NOT NULL,       -- Calorie count
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Key Design Decisions:**
- Simple single-table design for MVP
- Date stored as TEXT for easy querying
- Flexible meal naming (not restricted to breakfast/lunch/dinner)
- Optional description field for AI estimation context

### Phase 3: Backend API Development

#### Database Layer (`database.ts`)
- **Database class** with SQLite connection management
- **CRUD operations:** getMealsByDate, addMeal, updateMeal, deleteMeal
- **Aggregation queries:** getDailyTotals for calendar view
- **Type-safe interfaces** for Meal and DailyTotal

#### API Endpoints (`routes/meals.ts`)
- `GET /api/meals/:date` - Get all meals for a specific date
- `GET /api/meals/totals/:startDate/:endDate` - Get daily totals for date range
- `POST /api/meals` - Add new meal
- `PUT /api/meals/:id` - Update existing meal
- `DELETE /api/meals/:id` - Delete meal

#### LLM Integration (`routes/llm.ts`)
- `POST /api/llm/estimate-calories` - AI calorie estimation
- `GET /api/llm/models` - Available model list
- **Robust error handling** for API failures
- **Confidence scoring** (high/medium/low)
- **Reasoning explanations** from AI

### Phase 4: Frontend Components

#### Main Application (`page.tsx`)
- **State management** for selected date and settings dialog
- **Conditional rendering** between calendar and day views
- **Header with settings** access

#### Calendar View (`CalendarView.tsx`)
- **shadcn Calendar component** integration
- **Monthly data fetching** with date range queries
- **Daily calorie totals** display
- **Quick stats** aggregation (total calories, meals, averages)
- **Date selection** handler for navigation

#### Day View (`DayView.tsx`)
- **Daily meal list** with CRUD operations
- **Meal numbering** and renaming functionality
- **Daily summary** statistics
- **Add/Edit/Delete** meal actions
- **Back navigation** to calendar

#### Meal Dialog (`MealDialog.tsx`)
- **Tabbed interface** for manual vs AI input
- **Manual entry:** name, description, calories
- **AI estimation:** description → calories with confidence
- **Model selection** dropdown
- **API key management** with localStorage
- **Form validation** and error handling

#### Settings Dialog (`SettingsDialog.tsx`)
- **API key configuration** with show/hide toggle
- **Default model selection**
- **Data management** (clear all data option)
- **Local storage** for persistence

### Phase 5: Key Features Implementation

#### Calendar Interface ✅
- Monthly view with clickable dates
- Daily calorie totals displayed
- Navigation between months
- Quick stats overview

#### Multiple Meal Management ✅
- Add unlimited meals per day
- Rename meals to user preference
- Edit existing meals
- Delete meals with confirmation

#### Dual Input Methods ✅
- **Manual:** Direct calorie input
- **AI-Powered:** Food description → calorie estimation

#### LLM Integration ✅
- OpenAI-compatible API support
- Multiple model options (GPT-3.5, GPT-4, GPT-4 Turbo)
- User-provided API key
- Confidence levels and reasoning

#### Data Persistence ✅
- SQLite database for meal storage
- Local storage for user preferences
- Date-based data organization

## 🎨 UI/UX Design Principles

### shadcn/ui Integration
- **Consistent design system** with neutral color palette
- **Accessible components** with proper ARIA labels
- **Responsive design** for mobile and desktop
- **Loading states** and error handling

### User Experience
- **Intuitive navigation** between calendar and day views
- **Clear visual hierarchy** with cards and proper spacing
- **Immediate feedback** for user actions
- **Progressive disclosure** (settings in separate dialog)

## 🔧 Technical Decisions

### Frontend Architecture
- **Client-side state management** with React hooks
- **Type-safe API calls** with proper error handling
- **Local storage** for user preferences
- **Date manipulation** with date-fns library

### Backend Architecture
- **RESTful API design** with proper HTTP methods
- **Input validation** and sanitization
- **Error handling** with appropriate status codes
- **CORS configuration** for frontend communication

### Database Design
- **Simple SQLite** for easy deployment and backup
- **Normalized structure** with proper indexing
- **Date-based partitioning** for efficient queries

## 🚀 Deployment Considerations

### Development Setup
1. Start backend: `cd backend && npm run dev` (port 3001)
2. Start frontend: `npm run dev` (port 3000)
3. Database auto-initializes on first run

### Production Readiness
- Environment variable configuration
- Database backup strategies
- API rate limiting
- Error monitoring
- Performance optimization

## 📈 Future Enhancements

### Potential Features
- User authentication and multi-user support
- Nutrition tracking (protein, carbs, fat)
- Goal setting and progress tracking
- Data export/import functionality
- Mobile app development
- Meal photo recognition
- Recipe database integration

### Technical Improvements
- Database migrations system
- API caching layer
- Real-time updates with WebSockets
- Progressive Web App (PWA) features
- Offline functionality
- Data synchronization

## ✅ Requirements Fulfillment

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| Calendar-like app | ✅ | Monthly calendar with daily totals |
| Multiple daily inputs | ✅ | Unlimited meals per day with renaming |
| Direct calorie input | ✅ | Manual entry tab in meal dialog |
| AI calorie estimation | ✅ | LLM integration with confidence scoring |
| User-provided API key | ✅ | Settings dialog with secure storage |
| Model selection | ✅ | Dropdown with GPT models |
| Simple database | ✅ | SQLite with meal persistence |
| shadcn/ui components | ✅ | Complete UI built with shadcn |
| OpenAI-compatible API | ✅ | proxy.fuelix.ai integration |

This implementation successfully delivers all requested features with a clean, scalable architecture and excellent user experience.