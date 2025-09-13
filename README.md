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
## Runing the project
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
uvicorn app.main:app --reload --host:0.0.0.0 --port 8000
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