# Zerbin

**Zerbin** is a platform for managing and reporting misplaced waste.
It allows users to take photos of waste, automatically classify it using AI, and notify collection companies.

## Project Installation

### Clone the repository
```
git clone https://github.com/juanrobles05/Zerbin.git
cd zerbin
```
### Install global dependencies (project root)
```
npm install
```
### Install frontend dependencies
```
cd frontend
npm install
```
### Install backend dependencies
```
cd backend
python -m venv .venv
# Activate virtual environment
source .venv/bin/activate   # macOS / Linux
.venv\Scripts\activate      # Windows
# Install dependencies
pip install -r requirements.txt
```

## Environment Configuration

### Backend Environment Variables
Create a `.env` file in the `backend` directory for Neon database connection and other configurations.

**The complete `.env` file with all required values will be provided separately to each developer.**

### Frontend Environment Variables
Create a `.env` file in the `frontend` directory for Firebase Storage configuration.

**The complete `.env` file with Firebase credentials will be provided separately to each developer.**

Required variables include:
- Firebase project configuration
- Storage bucket settings
- Authentication keys

**Important Notes:**
- Never commit `.env` files to version control (they are already in `.gitignore`)
- Contact the scrum master to obtain the necessary `.env` files
- Make sure both `.env` files are properly configured before running the project

## Running the project

### Prerequisites
Before running the project, ensure you have:
1. ✅ Obtained the `.env` files from the scrum master
2. ✅ Placed the backend `.env` file in the `backend` directory
3. ✅ Placed the frontend `.env` file in the `frontend` directory
4. ✅ Installed all dependencies as described above

### Frontend (React Native)
```
cd frontend
npm start
```
### Backend (FastAPI)
```
cd backend
source .venv/bin/activate   # macOS / Linux
.venv\Scripts\activate      # Windows
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
## Commits with commitizen
This project uses Commitizen to standardize commit messages.
To make a commit:
```
npm run commit
```
o
```
npx cz
```

## Troubleshooting

### Common Issues

**Backend fails to start:**
- ✅ Verify you have the correct `.env` file in the `backend` directory
- ✅ Contact the project administrator if you don't have the `.env` file
- ✅ Ensure all required environment variables are properly set

**Frontend can't connect to backend:**
- ✅ Make sure the backend is running on `http://0.0.0.0:8000`
- ✅ Verify your device/emulator is on the same network as your development machine
- ✅ Ensure you have the correct frontend `.env` file with Firebase configuration

**Firebase Storage issues:**
- ✅ Verify you have the correct frontend `.env` file with Firebase credentials
- ✅ Contact the project administrator if Firebase integration is not working
- ✅ Ensure your `.env` file is placed in the correct `frontend` directory