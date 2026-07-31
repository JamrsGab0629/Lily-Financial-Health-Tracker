const transactionModel = require("../models/transactionModel");

/*
=========================================
GET ALL TRANSACTIONS
=========================================
*/

async function getTransactions() {

    return await transactionModel.getTransactions();

}

/*
=========================================
GET TRANSACTION BY ID
=========================================
*/

async function getTransactionById(id) {

    const transaction =
        await transactionModel.getTransactionById(id);

    if (!transaction) {
        throw new Error("Transaction not found.");
    }

    return transaction;

}

/*
=========================================
CREATE TRANSACTION
=========================================
*/

async function createTransaction(data) {

    if (!data.description)
        throw new Error("Description is required.");

    if (!data.amount || Number(data.amount) <= 0)
        throw new Error("Amount must be greater than zero.");

    if (
        data.type !== "income" &&
        data.type !== "expense"
    ) {
        throw new Error("Invalid transaction type.");
    }

    return await transactionModel.createTransaction(data);

}




/*
=========================================
DELETE TRANSACTION
=========================================
*/

async function deleteTransaction(id) {

    const transaction =
        await transactionModel.getTransactionById(id);

    if (!transaction)
        throw new Error("Transaction not found.");

    return await transactionModel.deleteTransaction(id);

}
/*
=========================================
UPDATE TRANSACTION
=========================================
*/


async function updateTransaction(id, data) {

    const transaction =
        await transactionModel.updateTransaction(id, data);

    if (!transaction) {
        throw new Error("Transaction not found.");
    }

    return transaction;
}
module.exports = {

    getTransactions,

    getTransactionById,

    createTransaction,

    updateTransaction,

    deleteTransaction

};