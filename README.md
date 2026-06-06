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

## 🧠 The Mathematics Explained (Layman's Terms)

If you are new to data science, the mathematical models used here might seem complex. Here is a simple, easy-to-understand breakdown of what is happening under the hood.

### ⚽ 1. The Poisson Goals Model (Simulating a Single Match)
In football, goals are rare, independent events that can happen at any random minute. To simulate a realistic scoreline between two teams, we use a probability formula called the **Poisson Distribution**.
- **Expected Goals (&lambda; - Lambda):** We calculate an expected average number of goals for each team by comparing the attacker's **Attack Rating** against the defender's **Defense Rating**.
  *   *Example:* If Argentina has a high Attack Rating and Morocco has an average Defense Rating, Argentina's expected goals (&lambda;) might be **1.8**. If Morocco has a lower Attack Rating, their expected goals against Argentina's defense might be **1.1**.
- **Rolling the Dice:** We feed these expected goal averages (1.8 vs 1.1) into the Poisson formula. The formula outputs a realistic random score based on those averages. Scores like `2-1`, `1-1`, or `2-0` will occur very frequently, while a score like `7-0` will be extremely rare, matching real-world football patterns.

### 🎲 2. Monte Carlo Simulations (Forecasting the Tournament)
Football is unpredictable—weak teams occasionally get lucky, and favorites can make mistakes. If we simulate the World Cup only once, we get one random timeline. 
To find the true mathematical favorites, we run **Monte Carlo Simulations**:
- The computer simulates **the entire World Cup from start to finish 1,000 times** in less than a second.
- We count how many times each team wins the trophy across all 1,000 runs.
  *   *Example:* If France wins the trophy in 150 out of 1,000 simulations, we say France has a **15% chance** of becoming the champion.
- This repetitive simulation gives us a highly accurate statistical model of the most likely outcomes.

---

## 📊 Chart Explanations (What do they represent?)

When you run a forecast on the workspace, three interactive charts are generated using **Chart.js**. Here is what they show:

1. **Round-by-Round Survival Probability (Line Chart):**
   - **What it is:** A line chart plotting the "survival curve" of the top 6 favorites.
   - **What it represents:** It shows the probability of each team surviving through each progressive stage of the tournament (Group Stage ➔ Round of 32 ➔ Round of 16 ➔ Quarterfinals ➔ Semifinals ➔ Final ➔ Champion).
   - **How to read it:** The lines slope downward as the competition gets tougher. A steep drop in a line indicates a high-risk round where that team is mathematically projected to face very strong opponents.

2. **Championship Win Probability (Bar Chart):**
   - **What it is:** A side-by-side bar comparison of the top 8 favorites.
   - **What it represents:** The direct percentage chance of each team winning the final match and lifting the trophy.
   - **How to read it:** The taller the bar, the higher the percentage of simulated tournaments that team won. It makes it easy to compare the direct win-odds of the top contenders at a glance.

3. **Odds Distribution by Group (Doughnut Chart):**
   - **What it is:** A circular doughnut chart showing the combined champion odds of each of the 12 groups (A to L).
   - **What it represents:** It aggregates the championship winning probabilities of all 4 teams within each group to see where the strongest contenders are clustered.
   - **How to read it:** The largest slices of the doughnut represent the groups containing the highest concentration of winning teams. This helps you visually identify the tournament's **"Group of Death"**.

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
