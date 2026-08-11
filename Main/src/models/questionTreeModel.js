// src/models/questionTreeModel.js
const { DECISION_TREE } = require("./decisionTreeModel");

/**
 * 
 * @param {string} intent 
 * @param {string} fuzzyTier 
 * @returns {Object} 
 */
function getNode(intent, fuzzyTier = "moderate") {
  const intentGroup = DECISION_TREE[intent] || DECISION_TREE["CHECK_HEALTH"];

  if (intentGroup[fuzzyTier]) {
    return intentGroup[fuzzyTier];
  }

  if (intentGroup["default"]) {
    return intentGroup["default"];
  }

  return DECISION_TREE["CHECK_HEALTH"]["moderate"];
}

module.exports = { 
  QUESTION_TREE: DECISION_TREE, 
  getNode 
};