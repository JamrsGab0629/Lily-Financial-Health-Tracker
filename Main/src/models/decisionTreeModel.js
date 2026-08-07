// src/models/decisionTreeModel.js
const questionsModule = require("./questionsModel");
const responsesModule = require("./responsesModel");

// Safely extract exports to prevent crashes caused by circular dependency loops or missing keys
const QUESTIONS = questionsModule.QUESTIONS || questionsModule || {};
const RESPONSES = responsesModule.RESPONSES || responsesModule || {};

// Reusable fallback definitions to prevent undefined reference errors
const FALLBACK_QUESTIONS = {
  CHECK_HIGHEST_SPENDING: { label: "Check Highest Spending 🔍", text: "Check Highest Spending 🔍", intent: "CHECK_HIGHEST_SPENDING" },
  CHECK_NEEDS_VS_WANTS: { label: "Needs vs. Wants Audit ⚖️", text: "Needs vs. Wants Audit ⚖️", intent: "CHECK_NEEDS_VS_WANTS" },
  CHECK_SAVINGS_GOAL: { label: "Did I hit my Savings Goal? 🎯", text: "Did I hit my Savings Goal? 🎯", intent: "CHECK_SAVINGS_GOAL" },
  CUT_EXPENSES: { label: "Where can I cut back? ✂️", text: "Where can I cut back? ✂️", intent: "CUT_EXPENSES" },
  FREEZE_BUDGET: { label: "Freeze Budget 🚨", text: "Freeze Budget 🚨", intent: "FREEZE_BUDGET" }
};

const DECISION_TREE = {
 
  "CHECK_HEALTH": {
    veryLow: {
      response: RESPONSES.OPTIMAL || { message: "Financial health is optimal!", alertTier: "Optimal" },
      isTerminal: false,
      nestedQuestions: [
        QUESTIONS.CHECK_HIGHEST_SPENDING || FALLBACK_QUESTIONS.CHECK_HIGHEST_SPENDING,
        QUESTIONS.CHECK_NEEDS_VS_WANTS || FALLBACK_QUESTIONS.CHECK_NEEDS_VS_WANTS,
        QUESTIONS.CHECK_SAVINGS_GOAL || FALLBACK_QUESTIONS.CHECK_SAVINGS_GOAL
      ]
    },
    low: {
      response: RESPONSES.STABLE || { message: "Financial health is stable.", alertTier: "Stable" },
      isTerminal: false,
      nestedQuestions: [
        QUESTIONS.CHECK_HIGHEST_SPENDING || FALLBACK_QUESTIONS.CHECK_HIGHEST_SPENDING,
        QUESTIONS.CHECK_NEEDS_VS_WANTS || FALLBACK_QUESTIONS.CHECK_NEEDS_VS_WANTS,
        QUESTIONS.CHECK_SAVINGS_GOAL || FALLBACK_QUESTIONS.CHECK_SAVINGS_GOAL
      ]
    },
    moderate: {
      response: RESPONSES.CAUTION || { message: "Exercise caution with recent spending.", alertTier: "Caution" },
      isTerminal: false,
      nestedQuestions: [
        QUESTIONS.CHECK_HIGHEST_SPENDING || FALLBACK_QUESTIONS.CHECK_HIGHEST_SPENDING,
        QUESTIONS.CHECK_NEEDS_VS_WANTS || FALLBACK_QUESTIONS.CHECK_NEEDS_VS_WANTS,
        QUESTIONS.CHECK_SAVINGS_GOAL || FALLBACK_QUESTIONS.CHECK_SAVINGS_GOAL
      ]
    },
    high: {
      response: RESPONSES.WARNING || { message: "High expense ratio detected!", alertTier: "Warning" },
      isTerminal: false,
      nestedQuestions: [
        QUESTIONS.CHECK_HIGHEST_SPENDING || FALLBACK_QUESTIONS.CHECK_HIGHEST_SPENDING,
        QUESTIONS.CHECK_NEEDS_VS_WANTS || FALLBACK_QUESTIONS.CHECK_NEEDS_VS_WANTS,
        QUESTIONS.CUT_EXPENSES || FALLBACK_QUESTIONS.CUT_EXPENSES
      ]
    },
    veryHigh: {
      response: RESPONSES.CRITICAL || { message: "Critical spending level!", alertTier: "Critical" },
      isTerminal: false,
      nestedQuestions: [
        QUESTIONS.CHECK_HIGHEST_SPENDING || FALLBACK_QUESTIONS.CHECK_HIGHEST_SPENDING,
        QUESTIONS.CHECK_NEEDS_VS_WANTS || FALLBACK_QUESTIONS.CHECK_NEEDS_VS_WANTS,
        QUESTIONS.FREEZE_BUDGET || FALLBACK_QUESTIONS.FREEZE_BUDGET
      ]
    }
  },

  // ==========================================
  // LEVEL 2 & 3: INTERACTIVE ACTION NODES
  // ==========================================
  
  // Dynamic Category Audit Node
  "CHECK_HIGHEST_SPENDING": {
    default: {
      response: { message: "", alertTier: "Info", emoji: "🧐" }, // Injected dynamically by financialService.js
      isTerminal: false,
      nestedQuestions: [
        QUESTIONS.CHECK_NEEDS_VS_WANTS || FALLBACK_QUESTIONS.CHECK_NEEDS_VS_WANTS,
        QUESTIONS.CHECK_SAVINGS_GOAL || FALLBACK_QUESTIONS.CHECK_SAVINGS_GOAL
      ]
    }
  },

  // Dynamic Needs vs. Wants Audit Node
  "CHECK_NEEDS_VS_WANTS": {
    default: {
      response: { message: "", alertTier: "Info", emoji: "⚖️" }, // Injected dynamically by financialService.js
      isTerminal: false,
      nestedQuestions: [
        QUESTIONS.CHECK_HIGHEST_SPENDING || FALLBACK_QUESTIONS.CHECK_HIGHEST_SPENDING,
        QUESTIONS.CHECK_SAVINGS_GOAL || FALLBACK_QUESTIONS.CHECK_SAVINGS_GOAL
      ]
    }
  },

  // Dynamic Savings Target Goal Node
  "CHECK_SAVINGS_GOAL": {
    default: {
      response: { message: "", alertTier: "Info", emoji: "🎯" }, // Injected dynamically by financialService.js
      isTerminal: false,
      nestedQuestions: [
        QUESTIONS.CHECK_NEEDS_VS_WANTS || FALLBACK_QUESTIONS.CHECK_NEEDS_VS_WANTS,
        QUESTIONS.CHECK_HIGHEST_SPENDING || FALLBACK_QUESTIONS.CHECK_HIGHEST_SPENDING
      ]
    }
  },

  // Dynamic Spending Leaks Node (Level 2 Fuzzy Action)
  "TRIM_LEAKS": {
    default: {
      response: { message: "", alertTier: "Caution", emoji: "✂️" },
      isTerminal: false,
      nestedQuestions: [] // Population handled dynamically by getNestedFuzzyQuestions("TRIM_LEAKS")
    }
  },

  // Emergency Buffer Audit (Level 3 Nested Action)
  "CHECK_EMERGENCY_FUND": {
    default: {
      response: { message: "", alertTier: "Info", emoji: "🛡️" },
      isTerminal: true,
      nestedQuestions: []
    }
  },

  // Monthly Comparison (Level 3 Nested Action)
  "COMPARE_MONTHS": {
    default: {
      response: { message: "", alertTier: "Info", emoji: "📅" },
      isTerminal: true,
      nestedQuestions: []
    }
  },

  // Runway Counter Node (Level 3 Nested Action)
  "CHECK_RUNWAY": {
    default: {
      response: { message: "", alertTier: "Warning", emoji: "⏳" },
      isTerminal: true,
      nestedQuestions: []
    }
  },

  // Discretionary Cutback Node (Level 3 Nested Action)
  "CUT_DISCRETIONARY": {
    default: {
      response: { message: "", alertTier: "Warning", emoji: "✂️" },
      isTerminal: true,
      nestedQuestions: []
    }
  },

  // Surplus & Investment Nodes
  "SURPLUS_ADVICE": {
    default: {
      response: { message: "", alertTier: "Optimal", emoji: "💡" },
      isTerminal: false,
      nestedQuestions: []
    }
  },
  "ALLOCATE_SURPLUS": {
    default: { response: { message: "", alertTier: "Optimal", emoji: "📈" }, isTerminal: true, nestedQuestions: [] }
  },
  "RAISE_SAVINGS_TARGET": {
    default: { response: { message: "", alertTier: "Optimal", emoji: "🚀" }, isTerminal: true, nestedQuestions: [] }
  },

  // Standard Terminal/Action Nodes
  "REWARD_CHECK": {
    default: { response: RESPONSES.REWARD_APPROVED || {}, isTerminal: true, nestedQuestions: [] }
  },
  "TRANSFER_SAVINGS": {
    default: { response: RESPONSES.SAVINGS_TRANSFERRED || {}, isTerminal: true, nestedQuestions: [] }
  },
  "SHOW_BREAKDOWN": {
    default: { 
      response: RESPONSES.BREAKDOWN_SHOWN || {}, 
      isTerminal: false, 
      nestedQuestions: [
        QUESTIONS.CHECK_NEEDS_VS_WANTS || FALLBACK_QUESTIONS.CHECK_NEEDS_VS_WANTS
      ] 
    }
  },
  "SET_GOAL": {
    default: { response: RESPONSES.GOAL_UPDATED || {}, isTerminal: true, nestedQuestions: [] }
  },
  "SHOW_CATEGORIES": {
    default: { 
      response: RESPONSES.CATEGORIES_AUDITED || {}, 
      isTerminal: false, 
      nestedQuestions: [
        QUESTIONS.CHECK_NEEDS_VS_WANTS || FALLBACK_QUESTIONS.CHECK_NEEDS_VS_WANTS
      ] 
    }
  },
  "DAILY_ALLOWANCE": {
    default: { response: RESPONSES.ALLOWANCE_CALCULATED || {}, isTerminal: true, nestedQuestions: [] }
  },
  "CUT_EXPENSES": {
    default: { response: RESPONSES.CUTS_SUGGESTED || {}, isTerminal: true, nestedQuestions: [] }
  },
  "TOP_TRANSACTIONS": {
    default: { response: RESPONSES.TRANSACTIONS_AUDITED || {}, isTerminal: true, nestedQuestions: [] }
  },
  "FREEZE_BUDGET": {
    default: { 
      response: RESPONSES.FREEZE_EXECUTED || { message: "", alertTier: "Critical", emoji: "🚨" }, 
      isTerminal: false, 
      nestedQuestions: []
    }
  },
  "RECOVERY_PLAN": {
    default: { response: RESPONSES.RECOVERY_ACTIVE || {}, isTerminal: true, nestedQuestions: [] }
  }
};

module.exports = { DECISION_TREE };