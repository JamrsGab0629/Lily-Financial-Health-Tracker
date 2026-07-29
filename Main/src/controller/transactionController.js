const transactionModel = require("../models/transactionModel");

async function createTransaction(req, res) {
    try {
        const transaction = await transactionModel.createTransaction(req.body);

        res.status(201).json({
            message: "Transaction created successfully",
            transaction
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create transaction"
        });
    }
}

async function getTransactions(req, res) {
    try {
        const transactions = await transactionModel.getTransactions();

        res.status(200).json(transactions);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to retrieve transactions"
        });
    }
}

async function deleteTransaction(req, res) {
    try {
        const transaction =
            await transactionModel.deleteTransaction(req.params.id);

        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        res.status(200).json({
            message: "Transaction deleted successfully",
            transaction
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to delete transaction"
        });
    }
}

module.exports = {
    createTransaction,
    getTransactions,
    deleteTransaction
};