const pool = require("../database/db");

async function createTransaction(transaction) {
    const { type, category, amount, date, description } = transaction;

    const result = await pool.query(
        `INSERT INTO transactions
        (type, category, amount, date, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [type, category, amount, date, description]
    );

    return result.rows[0];
}

async function getTransactions() {
    const result = await pool.query(
        `SELECT * FROM transactions
         ORDER BY date DESC, id DESC`
    );

    return result.rows;
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

module.exports = {
    createTransaction,
    getTransactions,
    deleteTransaction
};