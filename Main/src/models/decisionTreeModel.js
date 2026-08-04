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
      nestedQuestions: [
        QUESTIONS.CHECK_HIGHEST_SPENDING || { label: "Check Highest Spending 🔍", intent: "CHECK_HIGHEST_SPENDING" },
        QUESTIONS.CHECK_NEEDS_VS_WANTS || { label: "Needs vs. Wants Audit ⚖️", intent: "CHECK_NEEDS_VS_WANTS" },
        QUESTIONS.CHECK_SAVINGS_GOAL || { label: "Did I hit my Savings Goal? 🎯", intent: "CHECK_SAVINGS_GOAL" }
      ]
    },
    low: {
      response: RESPONSES.STABLE,
      isTerminal: false,
      nestedQuestions: [
        QUESTIONS.CHECK_HIGHEST_SPENDING || { label: "Check Highest Spending 🔍", intent: "CHECK_HIGHEST_SPENDING" },
        QUESTIONS.CHECK_NEEDS_VS_WANTS || { label: "Needs vs. Wants Audit ⚖️", intent: "CHECK_NEEDS_VS_WANTS" },
        QUESTIONS.CHECK_SAVINGS_GOAL || { label: "Did I hit my Savings Goal? 🎯", intent: "CHECK_SAVINGS_GOAL" }
      ]
    },
    moderate: {
      response: RESPONSES.CAUTION,
      isTerminal: false,
      nestedQuestions: [
        QUESTIONS.CHECK_HIGHEST_SPENDING || { label: "Check Highest Spending 🔍", intent: "CHECK_HIGHEST_SPENDING" },
        QUESTIONS.CHECK_NEEDS_VS_WANTS || { label: "Needs vs. Wants Audit ⚖️", intent: "CHECK_NEEDS_VS_WANTS" },
        QUESTIONS.CHECK_SAVINGS_GOAL || { label: "Did I hit my Savings Goal? 🎯", intent: "CHECK_SAVINGS_GOAL" }
      ]
    },
    high: {
      response: RESPONSES.WARNING,
      isTerminal: false,
      nestedQuestions: [
        QUESTIONS.CHECK_HIGHEST_SPENDING || { label: "Check Highest Spending 🔍", intent: "CHECK_HIGHEST_SPENDING" },
        QUESTIONS.CHECK_NEEDS_VS_WANTS || { label: "Needs vs. Wants Audit ⚖️", intent: "CHECK_NEEDS_VS_WANTS" },
        QUESTIONS.CUT_EXPENSES || { label: "Where can I cut back? ✂️", intent: "CUT_EXPENSES" }
      ]
    },
    veryHigh: {
      response: RESPONSES.CRITICAL,
      isTerminal: false,
      nestedQuestions: [
        QUESTIONS.CHECK_HIGHEST_SPENDING || { label: "Check Highest Spending 🔍", intent: "CHECK_HIGHEST_SPENDING" },
        QUESTIONS.CHECK_NEEDS_VS_WANTS || { label: "Needs vs. Wants Audit ⚖️", intent: "CHECK_NEEDS_VS_WANTS" },
        QUESTIONS.FREEZE_BUDGET || { label: "Freeze Budget 🚨", intent: "FREEZE_BUDGET" }
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
        QUESTIONS.CHECK_NEEDS_VS_WANTS || { label: "Analyze Needs vs. Wants ⚖️", intent: "CHECK_NEEDS_VS_WANTS" },
        QUESTIONS.CHECK_SAVINGS_GOAL || { label: "Did I hit my Savings Goal? 🎯", intent: "CHECK_SAVINGS_GOAL" }
      ]
    }
  },

  // Dynamic Needs vs. Wants Audit Node
  "CHECK_NEEDS_VS_WANTS": {
    default: {
      response: { message: "", alertTier: "Info", emoji: "⚖️" }, // Injected dynamically by financialService.js
      isTerminal: false,
      nestedQuestions: [
        QUESTIONS.CHECK_HIGHEST_SPENDING || { label: "Check Highest Spending 🔍", intent: "CHECK_HIGHEST_SPENDING" },
        QUESTIONS.CHECK_SAVINGS_GOAL || { label: "Check Savings Goal 🎯", intent: "CHECK_SAVINGS_GOAL" }
      ]
    }
  },

  // Dynamic Savings Target Goal Node
  "CHECK_SAVINGS_GOAL": {
    default: {
      response: { message: "", alertTier: "Info", emoji: "🎯" }, // Injected dynamically by financialService.js
      isTerminal: false,
      nestedQuestions: [
        QUESTIONS.CHECK_NEEDS_VS_WANTS || { label: "Analyze Needs vs. Wants ⚖️", intent: "CHECK_NEEDS_VS_WANTS" },
        QUESTIONS.CHECK_HIGHEST_SPENDING || { label: "Check Highest Spending 🔍", intent: "CHECK_HIGHEST_SPENDING" }
      ]
    }
  },

  // Standard Terminal/Action Nodes
  "REWARD_CHECK": {
    default: { response: RESPONSES.REWARD_APPROVED, isTerminal: true, nestedQuestions: [] }
  },
  "TRANSFER_SAVINGS": {
    default: { response: RESPONSES.SAVINGS_TRANSFERRED, isTerminal: true, nestedQuestions: [] }
  },
  "SHOW_BREAKDOWN": {
    default: { 
      response: RESPONSES.BREAKDOWN_SHOWN, 
      isTerminal: false, 
      nestedQuestions: [
        QUESTIONS.CHECK_NEEDS_VS_WANTS || { label: "Analyze Needs vs. Wants ⚖️", intent: "CHECK_NEEDS_VS_WANTS" }
      ] 
    }
  },
  "SET_GOAL": {
    default: { response: RESPONSES.GOAL_UPDATED, isTerminal: true, nestedQuestions: [] }
  },
  "SHOW_CATEGORIES": {
    default: { 
      response: RESPONSES.CATEGORIES_AUDITED, 
      isTerminal: false, 
      nestedQuestions: [
        QUESTIONS.CHECK_NEEDS_VS_WANTS || { label: "Analyze Needs vs. Wants ⚖️", intent: "CHECK_NEEDS_VS_WANTS" }
      ] 
    }
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