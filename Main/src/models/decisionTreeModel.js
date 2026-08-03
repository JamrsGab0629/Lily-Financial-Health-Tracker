// src/models/decisionTreeModel.js
const { QUESTIONS } = require("./questionsModel");
const { RESPONSES } = require("./responsesModel");

const DECISION_TREE = {
  // ==========================================
  // LEVEL 1: ROOT NODE (Fuzzy Set Branches)
  // ==========================================
  "CHECK_HEALTH": {
    veryLow: {
      response: RESPONSES.OPTIMAL,
      isTerminal: false,
      nestedQuestions: [QUESTIONS.REWARD_CHECK, QUESTIONS.TRANSFER_SAVINGS]
    },
    low: {
      response: RESPONSES.STABLE,
      isTerminal: false,
      nestedQuestions: [QUESTIONS.SHOW_BREAKDOWN, QUESTIONS.SET_GOAL]
    },
    moderate: {
      response: RESPONSES.CAUTION,
      isTerminal: false,
      nestedQuestions: [QUESTIONS.SHOW_CATEGORIES, QUESTIONS.DAILY_ALLOWANCE]
    },
    high: {
      response: RESPONSES.WARNING,
      isTerminal: false,
      nestedQuestions: [QUESTIONS.CUT_EXPENSES, QUESTIONS.TOP_TRANSACTIONS]
    },
    veryHigh: {
      response: RESPONSES.CRITICAL,
      isTerminal: false,
      nestedQuestions: [QUESTIONS.FREEZE_BUDGET, QUESTIONS.RECOVERY_PLAN]
    }
  },

  // ==========================================
  // LEVEL 2 & 3: TERMINAL ACTION NODES
  // ==========================================
  "REWARD_CHECK": {
    default: { response: RESPONSES.REWARD_APPROVED, isTerminal: true, nestedQuestions: [] }
  },
  "TRANSFER_SAVINGS": {
    default: { response: RESPONSES.SAVINGS_TRANSFERRED, isTerminal: true, nestedQuestions: [] }
  },
  "SHOW_BREAKDOWN": {
    default: { response: RESPONSES.BREAKDOWN_SHOWN, isTerminal: true, nestedQuestions: [] }
  },
  "SET_GOAL": {
    default: { response: RESPONSES.GOAL_UPDATED, isTerminal: true, nestedQuestions: [] }
  },
  "SHOW_CATEGORIES": {
    default: { response: RESPONSES.CATEGORIES_AUDITED, isTerminal: true, nestedQuestions: [] }
  },
  "DAILY_ALLOWANCE": {
    default: { response: RESPONSES.ALLOWANCE_CALCULATED, isTerminal: true, nestedQuestions: [] }
  },
  "CUT_EXPENSES": {
    default: { response: RESPONSES.CUTS_SUGGESTED, isTerminal: true, nestedQuestions: [] }
  },
  "TOP_TRANSACTIONS": {
    default: { response: RESPONSES.TRANSACTIONS_AUDITED, isTerminal: true, nestedQuestions: [] }
  },
  "FREEZE_BUDGET": {
    default: { response: RESPONSES.FREEZE_EXECUTED, isTerminal: true, nestedQuestions: [] }
  },
  "RECOVERY_PLAN": {
    default: { response: RESPONSES.RECOVERY_ACTIVE, isTerminal: true, nestedQuestions: [] }
  }
};

module.exports = { DECISION_TREE };