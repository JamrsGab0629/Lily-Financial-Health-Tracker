const express = require("express");
const router = express.Router();
const settingsController = require("../controller/settingsController");

router.get("/", settingsController.getSettings);
router.put("/", settingsController.updateSettings);

module.exports = router;