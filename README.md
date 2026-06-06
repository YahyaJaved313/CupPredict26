# CupPredict 2026 🏆
### FIFA World Cup Simulator & Data Forecast

**CupPredict 2026** is an interactive, data-driven tournament simulator for the upcoming 48-team 2026 FIFA World Cup. Built as a final showcase project for the **Stanford Code in Place 2026** Python course, this application allows users to explore the mathematical side of football, run statistical forecasts, customize team strengths, and follow live-simulated tournament paths.

🔗 **Live Deployment:** [https://cuppredict26.vercel.app](https://cuppredict26.vercel.app) *(or link your own deployed URL)*

---

## 🌟 Key Features

- **10,000 World Cups in Seconds (Monte Carlo Simulations):** Runs thousands of complete tournament simulations in a Python backend to tabulate exact championship odds and round-by-round survival percentages.
- **The Science (Poisson Goals Model):** Models matches using a Poisson probability distribution. Expected goals ($\lambda$) are calculated by mapping attack ratings against opponent defense ratings, scaled against historical tournament averages and host morale boosts.
- **Interactive "What-If" Sandbox:** Allows users to dynamically modify the Attack and Defense ratings (10-99) of all 48 teams. Adjust settings using presets ("Default", "Chaos Mode", "Heavyweight Dominance") and immediately rerun forecasts.
- **Staggered Reveal Bracket Animation:** Simulates a live knockout bracket step-by-step with connecting path animations highlighting the winner's journey.
- **Live Match Center:** Click on any simulated match to open an interactive overlay showing a live minute-by-minute clock, possession bars, shot attempts, and text commentary.

---

## 🛠️ Technology Stack

- **Backend:** Python 3.14, FastAPI (routing & simulations)
- **Frontend:** HTML5, Vanilla CSS3 (glassmorphic UI, fluid grid layouts, responsive widescreen design)
- **Visualizations:** Chart.js (interactive progression line, comparison bar, and group doughnut charts)
- **Hosting:** Vercel (Python Serverless Functions)

---

## 📂 Project Structure

```
CupPredict26/
├── api/
│   ├── main.py            # FastAPI ASGI routes & app initialization
│   ├── simulator.py       # Poisson goal math & Monte Carlo simulation engine
│   └── teams.json         # 48-team base FIFA ratings database
├── static/
│   ├── app.js             # Frontend routing, animations, and Chart.js integration
│   ├── index.html         # Main dashboard interface
│   ├── style.css          # Theme definitions, widescreen query scaling, and components
│   ├── stanford-logo.png  # Stanford logo asset
│   └── cip-favicon.ico    # Favicon asset
├── .gitignore             # Git ignore patterns
├── requirements.txt       # Python server dependencies
├── run.bat                # Windows executable batch script for easy local startup
└── vercel.json            # Vercel serverless build and routing configurations
```

---

## 🚀 Local Installation & Setup

Get CupPredict 2026 up and running locally on your machine:

### 1. Clone the Repository
```bash
git clone https://github.com/YahyaJaved313/CupPredict26.git
cd CupPredict26
```

### 2. Set Up Virtual Environment
On Windows:
```bash
python -m venv venv
venv\Scripts\activate
```
On macOS/Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Server
Using the batch script (Windows):
Double-click `run.bat` or run:
```bash
.\run.bat
```
Manual startup:
```bash
uvicorn api.main:app --reload
```
Open your browser and navigate to `http://localhost:8000`.

---

## ⚡ Deployment to Vercel

The repository is pre-configured with `vercel.json` for rapid deployment to the Vercel cloud:
1. Link your GitHub account on [Vercel](https://vercel.com).
2. Click **New Project** and import the `CupPredict26` repository.
3. Keep default settings and click **Deploy**. Vercel will build the Python dependencies automatically and publish your site.

---

## 👨‍💻 Developer Profiles

Connect with me and see my other work:
* **LinkedIn:** [linkedin.com/in/yahya-javed-142507334](https://www.linkedin.com/in/yahya-javed-142507334/)
* **GitHub:** [github.com/YahyaJaved313](https://github.com/YahyaJaved313)
* **Stanford Code in Place:** [Profile Link](https://codeinplace.stanford.edu/cip6/user/I90sLAovyMNPFISDkTuQtjWmMXe2)

---

*Built with passion for football, data science, and web development as a final project for Stanford's Code in Place 2026.*
