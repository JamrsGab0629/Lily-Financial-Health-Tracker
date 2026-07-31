# Lily Financial Health Tracker — Project Overview

**Lily Financial Health Tracker** is a fuzzy logic–powered personal finance management application designed to help users monitor, understand, and improve their financial health. The app combines expense tracking, savings management, financial analysis, and a friendly cat-themed assistant named **Lily** to provide users with personalized financial guidance.

Unlike traditional expense trackers that only record transactions, Lily uses a manually implemented **fuzzy logic system** to evaluate a user's financial condition in a more human-like way. Instead of using strict classifications such as "good" or "bad," fuzzy logic allows the system to understand different levels of financial behavior, such as partially healthy spending, moderate savings, or risky expenses.

The main goal of the application is to answer the question:

**"Am I financially healthy, and what can I improve?"**

---

# Lily Financial Assistant

Lily is a pixel-art orange cat assistant that interacts with users through a chatbot interface. She provides financial advice based on the user's financial data and changes her emotions depending on the user's financial condition.

Lily's emotions include:

* 😿 Sad — when the user has poor savings or excessive spending
* 😾 Angry — when the user's financial situation becomes critical
* 🙂 Happy — when the user maintains stable financial habits
* 😸 Very Happy — when the user demonstrates excellent money management

Example responses:

"Meow! Your savings are improving. Keep building good habits!"

"Meow... your expenses are becoming high compared to your income. Let's try reducing unnecessary spending."

---

# Fuzzy Logic Financial Evaluation System

The core feature of Lily Financial Health Tracker is a custom-built fuzzy logic engine implemented without external fuzzy logic libraries.

The system analyzes different financial factors and produces a Financial Health Score.

Instead of using fixed rules like:

"Income above ₱30,000 is good."

The fuzzy system evaluates gradual conditions.

Example:

A person earning ₱25,000 may have:

* 20% Low Income
* 70% Medium Income
* 10% High Income

This allows more realistic financial assessment.

---

# Fuzzy Logic Inputs

The system uses several inputs to determine financial health:

## 1. Savings Rate

Formula:

Savings Rate = (Savings / Income) × 100

The system evaluates whether the user's savings are:

* Low
* Moderate
* High

---

## 2. Expense Ratio

Formula:

Expense Ratio = (Expenses / Income) × 100

The system determines whether spending behavior is:

* Low spending
* Normal spending
* Overspending

---

## 3. Savings Goal Progress

Users can create financial goals such as:

"Save ₱10,000 in 3 months"

The system monitors progress and classifies it as:

* Behind goal
* Near goal
* Achieved

---

## 4. Spending Behavior

The application analyzes expense categories such as:

* Food
* Transportation
* Bills
* Entertainment
* Other expenses

The system determines whether spending habits are necessary or excessive.

---

# Financial Health Output

After processing the user's data, the fuzzy engine produces a Financial Health Score.

Example:

Financial Health Score: 78%

Status:

Good

Recommendation:

"You are managing your money well, but reducing unnecessary entertainment expenses can improve your savings."

The score classification:

* 0–30% → Poor
* 31–60% → Average
* 61–80% → Good
* 81–100% → Excellent

---

# Main Features

## Expense Tracking

Users can record:

* Expense name
* Amount
* Category
* Date

Example:

Food — ₱150 — July 31, 2026

---

## Income Tracking

Users can record:

* Salary
* Extra income
* Other sources of money

---

## Financial Dashboard

The dashboard displays:

* Total income
* Total expenses
* Total savings
* Financial health score
* Lily's current emotion
* Spending summaries

---

## Savings Goal Tracking

Users can create goals such as:

* Buying a laptop
* Emergency fund
* Travel savings

The system tracks progress based on the target amount and deadline.

---

## Spending Analysis

The application provides:

* Expense category breakdown
* Monthly spending trends
* Income versus expense comparison
* Savings progress

---

## Lily Chat Interface

A dedicated chat page allows users to communicate with Lily.

Features:

* Chat bubbles
* Pixel cat animations
* Blinking animation
* Talking animation
* Suggested financial questions

Examples:

* "How is my financial health?"
* "Am I overspending?"
* "How can I save more?"
* "What should I improve?"

---

# Gamification System

The application introduces game-like financial monitoring through a health bar system.

Example:

Lily Financial Health:

████████░░ 80%

Status:

Healthy

The health bar changes depending on the user's financial behavior.

Good habits increase the score, while excessive spending decreases it.

---

# Technology Stack

## Frontend

* HTML
* CSS
* JavaScript



---

## Backend

node js backend responsible for:

* API handling
* Business logic
* Fuzzy logic calculations
* Database communication

---

## Database

PostgresSQL (supabase)
Stores:

* User information
* Transactions
* Income records
* Savings goals
* Financial history

Possible database options:

* PostgreSQL
* SQLite
* Supabase

---

# System Architecture

The recommended architecture follows a layered structure:

Frontend
↓
API Routes
↓
Service Layer
↓
Fuzzy Logic Engine
↓
Database

The fuzzy logic module is separated into components:

* Membership Functions
* Fuzzy Rules
* Inference Engine
* Defuzzification

This makes the system easier to maintain and expand.

---

# Project Uniqueness

Lily Financial Health Tracker is different from normal expense tracking applications because it combines:

* Artificial intelligence concepts through fuzzy logic
* Personalized financial recommendations
* Chatbot interaction
* Gamification
* Data visualization
* Financial behavior analysis
* A friendly companion experience

Instead of simply recording money, Lily helps users understand their financial habits and make better decisions.

---

# Project Difficulty

For a 3rd-year Computer Science project, Lily Financial Health Tracker is estimated to have a difficulty level of **8.5/10** because it combines:

* Full-stack development
* Database design
* Artificial intelligence algorithms
* User experience design
* Software architecture
* Data analysis

The most challenging part is designing the fuzzy logic system and connecting it effectively with real financial data.

---

**In summary, Lily Financial Health Tracker is a gamified fuzzy logic financial assistant that transforms traditional expense tracking into a personalized financial coaching experience through a friendly cat companion.**
