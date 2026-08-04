// models/questionsModel.js

const QUESTIONS = {
  CHECK_HEALTH: { label: "Financial Health Status 🩺", intent: "CHECK_HEALTH" },
  CHECK_HIGHEST_SPENDING: { label: "Check Highest Spending 🔍", intent: "CHECK_HIGHEST_SPENDING" },
  CHECK_NEEDS_VS_WANTS: { label: "Needs vs. Wants Audit ⚖️", intent: "CHECK_NEEDS_VS_WANTS" },
  CHECK_SAVINGS_GOAL: { label: "Did I hit my Savings Goal? 🎯", intent: "CHECK_SAVINGS_GOAL" },
  REWARD_CHECK: { label: "Can I afford a reward? 🎁", intent: "REWARD_CHECK" },
  SHOW_BREAKDOWN: { label: "Show full breakdown 📊", intent: "SHOW_BREAKDOWN" },
  DAILY_ALLOWANCE: { label: "Calculate daily allowance 💵", intent: "DAILY_ALLOWANCE" },
  CUT_EXPENSES: { label: "Where can I cut back? ✂️", intent: "CUT_EXPENSES" },
  FREEZE_BUDGET: { label: "Freeze Budget 🚨", intent: "FREEZE_BUDGET" }
};

const PRIMARY_QUESTIONS = [
  {
    id: "check_health",
    intent: "CHECK_HEALTH",
    text: "🩺 How is my overall financial health?"
  },
  {
    id: "check_spending",
    intent: "CHECK_HIGHEST_SPENDING",
    text: "🔍 What is my highest expense category?"
  },
  {
    id: "check_needs_wants",
    intent: "CHECK_NEEDS_VS_WANTS",
    text: "⚖️ How am I balancing my Needs vs. Wants?"
  },
  {
    id: "check_savings_goal",
    intent: "CHECK_SAVINGS_GOAL",
    text: "🎯 Am I meeting my target savings rate?"
  }
];

const FOLLOW_UP_QUESTIONS = {
  CHECK_HEALTH: [
    {
      id: "followup_highest_spend",
      intent: "CHECK_HIGHEST_SPENDING",
      text: "🔍 Show my highest spending category"
    },
    {
      id: "followup_needs_wants",
      intent: "CHECK_NEEDS_VS_WANTS",
      text: "⚖️ Analyze my Needs vs. Wants"
    },
    {
      id: "followup_savings_goal",
      intent: "CHECK_SAVINGS_GOAL",
      text: "🎯 Check my savings goal progress"
    }
  ],

  CHECK_HIGHEST_SPENDING: [
    {
      id: "followup_needs_wants_from_spend",
      intent: "CHECK_NEEDS_VS_WANTS",
      text: "⚖️ Are these expenses Needs or Wants?"
    },
    {
      id: "followup_savings_goal_from_spend",
      intent: "CHECK_SAVINGS_GOAL",
      text: "🎯 Can I still reach my savings target?"
    }
  ],

  CHECK_NEEDS_VS_WANTS: [
    {
      id: "followup_highest_spend_from_audit",
      intent: "CHECK_HIGHEST_SPENDING",
      text: "🔍 Which category cost me the most?"
    },
    {
      id: "followup_health_from_audit",
      intent: "CHECK_HEALTH",
      text: "🩺 How does this affect my Health Score?"
    }
  ],

  CHECK_SAVINGS_GOAL: [
    {
      id: "followup_needs_wants_from_goal",
      intent: "CHECK_NEEDS_VS_WANTS",
      text: "⚖️ Where can I cut back on Wants?"
    },
    {
      id: "followup_highest_spend_from_goal",
      intent: "CHECK_HIGHEST_SPENDING",
      text: "🔍 View full category breakdown"
    }
  ]
};

function getPrimaryQuestions() {
  return PRIMARY_QUESTIONS;
}

function getFollowUpQuestions(intent) {
  return FOLLOW_UP_QUESTIONS[intent] || PRIMARY_QUESTIONS.slice(0, 3);
}

module.exports = {
  QUESTIONS, // <--- Exporting QUESTIONS prevents the undefined error
  getPrimaryQuestions,
  getFollowUpQuestions,
  PRIMARY_QUESTIONS,
  FOLLOW_UP_QUESTIONS
};