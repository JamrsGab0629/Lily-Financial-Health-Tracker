const pool = require("../database/db");

async function createTransaction(transaction) {
    const {
        type,
        category,
        amount,
        transaction_date,
        description
    } = transaction;

    const result = await pool.query(
        `INSERT INTO transactions
        (type, category, amount, transaction_date, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [
            type,
            category,
            amount,
            transaction_date,
            description
        ]
    );

    return result.rows[0];
}

async function getTransactions() {
    const result = await pool.query(
        `SELECT * FROM transactions
         ORDER BY transaction_date DESC, id DESC`
    );

    return result.rows;
}

// ADDED: Fetch transaction by ID so service layers can verify existence
async function getTransactionById(id) {
    const result = await pool.query(
        `SELECT * FROM transactions WHERE id = $1`,
        [id]
    );

    return result.rows[0];
}

async function deleteTransaction(id) {
    const result = await pool.query(
        `DELETE FROM transactions
         WHERE id = $1
         RETURNING *`,
        [id]
    );

    return result.rows[0];
}

async function updateTransaction(id, transaction) {

    const {
        type,
        category,
        amount,
        transaction_date,
        description
    } = transaction;

    const result = await pool.query(
        `UPDATE transactions
         SET
            type = $1,
            category = $2,
            amount = $3,
            transaction_date = $4,
            description = $5
         WHERE id = $6
         RETURNING *`,
        [
            type,
            category,
            amount,
            transaction_date,
            description,
            id
        ]
    );

    return result.rows[0];
}

module.exports = {
    createTransaction,
    getTransactions,
    getTransactionById, // Exported here!
    deleteTransaction,
    updateTransaction
};