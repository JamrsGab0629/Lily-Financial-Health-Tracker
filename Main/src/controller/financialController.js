const financialService = require("../services/financialService");

async function getFinancialSummary(req, res) {
    try {
        const summary =
            await financialService.getFinancialSummary();

        res.status(200).json(summary);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to calculate financial summary."
        });
    }
}

module.exports = {
    getFinancialSummary
};