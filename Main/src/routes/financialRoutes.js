const express = require("express");

const router = express.Router();

const financialController =
    require("../controller/financialController");

// 1. Existing Summary Route (GET /api/financial/summary)
router.get(
    "/summary",
    financialController.getFinancialSummary
);

// 2. New Lily Chat Route (POST /api/financial/lily-chat)
router.post(
    "/lily-chat",
    financialController.handleLilyChat
);

module.exports = router;