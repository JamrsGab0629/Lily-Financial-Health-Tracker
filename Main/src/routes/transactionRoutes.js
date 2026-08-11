const express = require("express");

const router = express.Router();

const transactionController =
    require("../controller/transactionController");

router.post("/", transactionController.createTransaction);
router.get("/", transactionController.getTransactions);
router.delete("/:id", transactionController.deleteTransaction);
router.put("/:id", transactionController.updateTransaction);

module.exports = router;