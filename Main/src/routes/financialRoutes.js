const express = require("express");

const router = express.Router();

const financialController =
    require("../controller/financialController");

router.get(
    "/summary",
    financialController.getFinancialSummary
);

router.post(
    "/lily-chat",
    financialController.handleLilyChat
);

module.exports = router;