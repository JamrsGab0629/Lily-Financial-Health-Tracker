// src/models/questionTreeModel.js
const { DECISION_TREE } = require("./decisionTreeModel");

/**
 * Traverses the Fuzzy Decision Tree based on intent and fuzzy membership tier
 * @param {string} intent - User intent (e.g. "CHECK_HEALTH", "FREEZE_BUDGET")
 * @param {string} fuzzyTier - Dominant fuzzy tier ("veryLow", "low", "moderate", "high", "veryHigh")
 * @returns {Object} Target node containing response, isTerminal status, and nestedQuestions
 */
function getNode(intent, fuzzyTier = "moderate") {
  // 1. Locate the intent group in the Decision Tree (default to CHECK_HEALTH if missing)
  const intentGroup = DECISION_TREE[intent] || DECISION_TREE["CHECK_HEALTH"];

  // 2. Return the specific fuzzy tier branch (for LEVEL 1 root nodes)
  if (intentGroup[fuzzyTier]) {
    return intentGroup[fuzzyTier];
  }

  // 3. Return the default leaf node branch (for LEVEL 2/3 terminal nodes)
  if (intentGroup["default"]) {
    return intentGroup["default"];
  }

  // 4. Safe fallback to prevent runtime crashes
  return DECISION_TREE["CHECK_HEALTH"]["moderate"];
}

module.exports = { 
  QUESTION_TREE: DECISION_TREE, 
  getNode 
};