const settingsService = require("../services/settingsService");

async function getSettings(req, res) {
  try {
    
    const settings = await settingsService.fetchUserSettings(); 
    res.status(200).json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

async function updateSettings(req, res) {
  try {
    const { target_savings_rate } = req.body;
    const settings = await settingsService.modifyUserSettings(target_savings_rate); 
    res.status(200).json({
      message: "Settings updated successfully",
      settings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  getSettings,
  updateSettings
};