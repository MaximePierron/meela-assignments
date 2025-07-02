# Meela Take-Home Task - Client Onboarding Form (Rust + React)

.PHONY: install start-backend start-frontend start clean setup-db

# Install dependencies for both frontend and backend
install:
	@echo "Installing Rust dependencies..."
	cd backend && cargo build
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✅ All dependencies installed!"

# Setup database
setup-db:
    @echo "Setting up database..."
    @echo "Cleaning old database..."
    cd backend && rm -f forms.db
    @echo "Creating new database..."
    cd backend && touch forms.db
    @echo "Creating forms table..."
    cd backend && sqlite3 forms.db "CREATE TABLE IF NOT EXISTS forms ( \
        uuid TEXT PRIMARY KEY, \
        data TEXT NOT NULL, \
        updated_at TEXT NOT NULL \
    );" || true
    @echo "✅ Database ready!"

# Start Rust backend server
start-backend: setup-db
	@echo "Starting Rust backend server on http://localhost:3005..."
	cd backend && cargo run

# Start frontend development server  
start-frontend:
	@echo "Starting frontend server on http://localhost:5173..."
	cd frontend && npm run dev

# Start both servers (requires separate terminals)
start:
	@echo "🚀 Starting Meela Onboarding Form System (Rust + React)"
	@echo ""
	@echo "1. First, start the backend in one terminal:"
	@echo "   make start-backend"
	@echo ""
	@echo "2. Then, start the frontend in another terminal:"
	@echo "   make start-frontend"
	@echo ""
	@echo "3. Visit http://localhost:5173 to use the app"
	@echo ""
	@echo "Backend API will be running on http://localhost:3005"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	cd backend && cargo clean
	rm -rf node_modules
	cd backend && rm -f forms.db
	@echo "✅ Cleaned!"

# Quick setup and instructions
setup: install setup-db
	@echo ""
	@echo "🎉 Setup complete!"
	@echo ""
	@echo "To start the application:"
	@echo "1. Terminal 1: make start-backend"
	@echo "2. Terminal 2: make start-frontend"
	@echo "3. Open http://localhost:5173"
	@echo ""
	@echo "The app demonstrates:"
	@echo "✅ Multi-step form with partial submission"
	@echo "✅ Save progress and resume later"
	@echo "✅ Unique URLs with UUIDs"
	@echo "✅ Dashboard to manage multiple forms"
	@echo "✅ Rust backend with SQLite database"

# Development helpers
dev-backend:
	@echo "Starting backend in development mode..."
	cd backend && cargo watch -x run

check:
	@echo "Checking Rust code..."
	cd backend && cargo check
	cd backend && cargo clippy
	@echo "✅ Code check complete!"