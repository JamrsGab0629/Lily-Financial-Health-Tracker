// models/settingsModel.js
const db = require("../database/db");

async function getSettingsFromDB() {
  const { rows } = await db.query(
    "SELECT target_savings_rate FROM settings WHERE id = true LIMIT 1"
  );
  return rows.length > 0 ? Number(rows[0].target_savings_rate) : 30;
}

async function updateSettingsInDB(target_savings_rate) {
  const query = `
    INSERT INTO settings (id, target_savings_rate, updated_at)
    VALUES (true, $1, NOW())
    ON CONFLICT (id) DO UPDATE 
    SET target_savings_rate = EXCLUDED.target_savings_rate,
        updated_at = NOW()
    RETURNING target_savings_rate;
  `;
  const { rows } = await db.query(query, [target_savings_rate]);
  return Number(rows[0].target_savings_rate);
}

module.exports = {
  getSettingsFromDB,
  updateSettingsInDB
};