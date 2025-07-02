# Meela Client Onboarding Form - Take-Home Task

## Overview

A simple client intake form system that supports **partial form submission** with the ability to resume later. Built with Rust backend and React frontend.

## Features

- ✅ Multi-step form with 3+ questions across different sections
- ✅ Save progress functionality (manual save button)
- ✅ Resume capability via UUID in URL
- ✅ Dashboard to view all saved forms
- ✅ No authentication required
- ✅ Frontend-backend communication
- ✅ Database persistence (SQLite)

## Technology Stack

- **Frontend**: React with Vite
- **Backend**: Rust with Poem framework
- **Database**: SQLite
- **API**: REST

## Prerequisites

- Rust (latest stable)
- Node.js (v16 or higher)
- npm

## Setup Instructions

### Quick Start

```bash
# Install all dependencies and setup database
make setup

# Start backend (Terminal 1)
make start-backend

# Start frontend (Terminal 2)
make start-frontend
```

### Manual Setup

#### Backend Setup

```bash
# Install Rust dependencies
cargo build

# Create .env file (already provided)
# DATABASE_URL=sqlite:./forms.db

# Start the Rust server
cargo run
```

Backend will run on http://localhost:3005

#### Frontend Setup

```bash
npm install
npm run dev
```

Frontend will run on http://localhost:5173

## Usage

1. **Start New Form**: Visit http://localhost:5173 and click "New Questionnaire"
2. **Fill Partial Data**: Answer some questions (don't need to complete all)
3. **Save Progress**: Click "Save" button at any time
4. **Get Unique URL**: After saving, you'll get a unique URL with UUID
5. **Resume Later**: Use the URL or go back to dashboard to continue
6. **View All Forms**: Dashboard shows all saved forms with progress indicators

## Form Structure

- **Step 1 - Basic Info**: Name, Age
- **Step 2 - Preferences**: What are you looking for in therapy?
- **Step 3 - Experience**: Have you seen a therapist before?

## API Endpoints

- `GET /forms` - List all saved forms
- `POST /form` - Save/update form data
- `GET /form/:uuid` - Load specific form
- `DELETE /form/:uuid` - Delete form

## Database Schema

```sql
CREATE TABLE forms (
  uuid TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## Technology Choice

I chose to implement the backend in Rust using the provided infrastructure, adapting the existing Poem framework setup to handle form persistence. This demonstrates familiarity with Rust while building upon the provided foundation.

## Key Features Demonstrated

### Partial Form Submission ✅

- Users can save at any point during form completion
- Progress is preserved exactly where they left off
- No data loss between sessions

### Resume Capability ✅

- Unique UUID generates shareable URLs
- Dashboard shows all incomplete forms
- Click to continue exactly where left off

### Simple UX ✅

- Clean, minimal interface
- Progress indicators show completion status
- Clear navigation between steps

## Rust Backend Features

- **Type Safety**: Leverages Rust's type system for API safety
- **Error Handling**: Proper error types with appropriate HTTP status codes
- **JSON Serialization**: Automatic serialization/deserialization with serde
- **Database Integration**: SQLx for type-safe database operations
- **UUID Generation**: Built-in UUID support for unique form identifiers

## Development Commands

```bash
# Check code quality
make check

# Clean build artifacts
make clean

# Auto-restart backend on changes (requires cargo-watch)
make dev-backend
```

## Time Spent

Approximately 4-5 hours focused on core functionality and Rust backend implementation as requested.
