# Lily — Financial Health Tracker 🐱

Lily is an intelligent, empathetic personal financial health tracker powered by a **Mamdani Fuzzy Inference System (FIS)**. Instead of relying on rigid, binary budgeting limits, Lily uses human-like linguistic reasoning to evaluate your cash flow and provide real-time, adaptive guidance through an interactive dashboard and animated virtual pet companion.

---

## 🎥 Presentation Video
*Watch the project presentation and system walkthrough here:*
Link (https://drive.google.com/file/d/16Ic2i0Xs4X1PJUibkl7BGWWsnE-yfGLe/view?usp=drive_link)

---

## 🧠 Core Features & Fuzzy Logic Engine
Lily moves beyond traditional budgeting apps by analyzing four key financial inputs through a fuzzy decision tree:
1. **Spending Pace Ratio:** Measures how fast expenses accumulate relative to your monthly budget timeline.
2. **Needs vs. Wants Ratio:** Evaluates the proportion of essential needs versus discretionary wants in total spending (flagging heavy fixed-cost overheads).
3. **Savings Rate:** Measures the proportion of your income successfully set aside as savings.
4. **Burn Rate / Expense Velocity:** Analyzes daily cash-flow depletion rates to detect accelerated or hazardous spending trends.

Through Mamdani fuzzy logic, the system processes these inputs using IF-THEN rules, clips output membership functions based on firing strengths, and aggregates them into a precise financial health score.

---

## 💻 Tech Stack
* **Backend:** Node.js, JavaScript (ES6 Modules)
* **Database:** PostgreSQL (`pg`)
* **Cloud** Supabase
* **Environment & Development:** `dotenv` (for environment configuration), `nodemon` (for live-reload development)
* **Fuzzy Logic Engine:** Custom Mamdani Fuzzy Inference System implementation (built-in fuzzification, rule evaluation, and defuzzification algorithms)
* **Frontend:** HTML5, CSS3, Vanilla JavaScript
* **Development & Version Control:** VS Code, Git, npm

---

## 🛠️ Prerequisites & What to Download
Before running the project locally, make sure you have the following installed on your machine:
* **[Node.js](https://nodejs.org/)** (v18 or higher recommended) — Includes npm for managing dependencies.
* **[PostgreSQL](https://www.postgresql.org/)** — Relational database for storing user data, transactions, and financial records.
* **[Git](https://git-scm.com/)** — For cloning the repository.
* **[VS Code](https://code.visualstudio.com/)** (or any preferred code editor) — Recommended for development.
* A modern web browser (Google Chrome, Firefox, Edge, or Brave).

---

## 🚀 How to Run the Project Locally

Follow these steps to set up and run Lily on your local machine:

### 1. Clone the Repository
Open your terminal (or Git Bash) and run:
```bash
git clone [https://github.com/your-username/lily-financial-tracker.git](https://github.com/your-username/lily-financial-tracker.git)
cd lily-financial-tracker