const transactionService = require("../services/transactionService");

/*
=========================================
CREATE TRANSACTION
=========================================
*/
async function createTransaction(req, res) {
    try {

        const transaction =
            await transactionService.createTransaction(req.body);

        res.status(201).json({
            message: "Transaction created successfully",
            transaction
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }
}

/*
=========================================
GET ALL TRANSACTIONS
=========================================
*/
async function getTransactions(req, res) {
    try {

        const transactions =
            await transactionService.getTransactions();

        res.status(200).json(transactions);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }
}

/*
=========================================
UPDATE TRANSACTION
=========================================
*/
async function updateTransaction(req, res) {
    try {

        const transaction =
            await transactionService.updateTransaction(
                req.params.id,
                req.body
            );
        res.status(200).json({
            message: "Transaction updated successfully",
            transaction
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }
}

/*
=========================================
DELETE TRANSACTION
=========================================
*/
async function deleteTransaction(req, res) {
    try {

        const transaction =
            await transactionService.deleteTransaction(req.params.id);

        res.status(200).json({
            message: "Transaction deleted successfully",
            transaction
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }
}


module.exports = {
    createTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction
};