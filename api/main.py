import os
import json
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional

# Import the simulator module
# On Vercel, the python path starts at the root directory, so we import from api.simulator.
# We add a fallback try-except for local running outside of uvicorn's root context.
try:
    from api.simulator import TournamentSimulator
except ImportError:
    try:
        from simulator import TournamentSimulator
    except ImportError:
        import sys
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from simulator import TournamentSimulator

app = FastAPI(title="CupPredict 2026 API")

# Define Pydantic request models
class TeamModel(BaseModel):
    name: str
    code: str
    group: str
    rank: int
    attack: int
    defense: int

class SimulateRequest(BaseModel):
    teams: List[TeamModel]
    host_boost: Optional[bool] = False

class MonteCarloRequest(BaseModel):
    teams: List[TeamModel]
    simulations_count: Optional[int] = 1000
    host_boost: Optional[bool] = False

# Locate files relative to main.py
BASE_DIR = Path(__file__).resolve().parent

@app.get("/api/teams")
def get_teams():
    """Retrieve the default database of 48 teams."""
    teams_file = BASE_DIR / "teams.json"
    if not teams_file.exists():
        raise HTTPException(status_code=404, detail="teams.json database not found.")
    
    try:
        with open(teams_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read teams: {str(e)}")

@app.post("/api/simulate-once")
def simulate_once(request: SimulateRequest):
    """Run a single complete tournament simulation."""
    try:
        teams_list = [team.model_dump() if hasattr(team, "model_dump") else team.dict() for team in request.teams]
        simulator = TournamentSimulator(teams_list)
        return simulator.simulate_tournament(host_boost=request.host_boost)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")

@app.post("/api/monte-carlo")
def run_monte_carlo(request: MonteCarloRequest):
    """Run N tournament simulations and return statistics for win probabilities."""
    try:
        # Cap simulations at 2000 to prevent serverless function timeouts (max 10s on Vercel hobby)
        count = min(request.simulations_count, 2000)
        teams_list = [team.model_dump() if hasattr(team, "model_dump") else team.dict() for team in request.teams]
        simulator = TournamentSimulator(teams_list)
        return simulator.run_monte_carlo(simulations_count=count, host_boost=request.host_boost)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Monte Carlo execution error: {str(e)}")

# Mount static files last so they don't override the API routes.
# The static folder is in the root directory, which is one level up from this file.
static_directory = BASE_DIR.parent / "static"

if static_directory.exists():
    app.mount("/", StaticFiles(directory=str(static_directory), html=True), name="static")
else:
    # Local fallback in case files are placed differently
    local_static = BASE_DIR / "static"
    if local_static.exists():
        app.mount("/", StaticFiles(directory=str(local_static), html=True), name="static")
