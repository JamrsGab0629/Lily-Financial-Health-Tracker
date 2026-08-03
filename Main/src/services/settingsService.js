// services/settingsService.js
const settingsModel = require("../models/settingsModel");

async function fetchUserSettings() {
  const targetSavingsRate = await settingsModel.getSettingsFromDB();
  return { target_savings_rate: targetSavingsRate };
}

async function modifyUserSettings(rate) {
  const numericRate = Number(rate);

  // Business Logic: Validation
  if (isNaN(numericRate) || numericRate < 0 || numericRate > 100) {
    throw new Error("Target savings rate must be a percentage between 0 and 100.");
  }

  const updatedRate = await settingsModel.updateSettingsInDB(numericRate);
  return { target_savings_rate: updatedRate };
}

module.exports = {
  fetchUserSettings,
  modifyUserSettings
};