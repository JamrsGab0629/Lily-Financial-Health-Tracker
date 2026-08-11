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

// Fetch transaction by ID
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

async function getTotalsFromDB() {
    const totalsQuery = `
        SELECT 
            COALESCE(SUM(CASE WHEN LOWER(TRIM(type)) = 'income' THEN amount::numeric ELSE 0 END), 0) AS total_income,
            COALESCE(SUM(CASE WHEN LOWER(TRIM(type)) = 'expense' THEN amount::numeric ELSE 0 END), 0) AS total_expense
        FROM transactions
        WHERE DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', CURRENT_DATE);
    `;
    const result = await pool.query(totalsQuery);
    return result.rows[0];
}

async function getCategoryBreakdownFromDB() {
    const categoryQuery = `
        SELECT 
            COALESCE(category, 'Uncategorized') AS category, 
            SUM(amount::numeric) AS total_amount 
        FROM transactions 
        WHERE LOWER(TRIM(type)) IN ('expense', 'expenses', 'debit')
        GROUP BY COALESCE(category, 'Uncategorized')
        ORDER BY total_amount DESC;
    `;
    const result = await pool.query(categoryQuery);
    return result.rows;
}

/*
=====================================
MONTHLY COMPARISON QUERIES
=====================================
*/

async function getMonthlyComparisonFromDB() {
    const comparisonQuery = `
        SELECT 
            -- Current Month
            COALESCE(SUM(CASE WHEN DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', CURRENT_DATE) 
                              AND LOWER(TRIM(type)) = 'income' THEN amount::numeric ELSE 0 END), 0) AS current_month_income,
            COALESCE(SUM(CASE WHEN DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', CURRENT_DATE) 
                              AND LOWER(TRIM(type)) = 'expense' THEN amount::numeric ELSE 0 END), 0) AS current_month_expense,
            
            -- Last Month
            COALESCE(SUM(CASE WHEN DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
                              AND LOWER(TRIM(type)) = 'income' THEN amount::numeric ELSE 0 END), 0) AS last_month_income,
            COALESCE(SUM(CASE WHEN DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
                              AND LOWER(TRIM(type)) = 'expense' THEN amount::numeric ELSE 0 END), 0) AS last_month_expense
        FROM transactions;
    `;
    const result = await pool.query(comparisonQuery);
    return result.rows[0];
}

/*
=====================================
SETTINGS / TARGET SAVINGS RATE QUERIES
=====================================
*/

async function getTargetSavingsRate() {
    try {
        const result = await pool.query(
            `SELECT target_savings_rate FROM settings LIMIT 1`
        );
        if (result.rows.length > 0 && result.rows[0].target_savings_rate !== null) {
            return parseFloat(result.rows[0].target_savings_rate);
        }
        return 20; // Default fallback percentage
    } catch (error) {
        console.warn("Could not fetch target savings rate from DB, defaulting to 20%:", error.message);
        return 20;
    }
}

async function updateTargetSavingsRate(newRate) {
    const result = await pool.query(
        `UPDATE settings SET target_savings_rate = $1 RETURNING *`,
        [newRate]
    );
    return result.rows[0];
}

module.exports = {
    createTransaction,
    getTransactions,
    getTransactionById,
    deleteTransaction,
    updateTransaction,
    getTotalsFromDB,
    getCategoryBreakdownFromDB,
    getMonthlyComparisonFromDB,
    getTargetSavingsRate,
    updateTargetSavingsRate
};