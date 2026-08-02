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
async function handleLilyChat(req, res) {
    try {
        const { intent } = req.body;
        const result = await financialService.processLilyChat(intent);
        res.json(result);
    } catch (error) {
        console.error("Error processing Lily chat:", error);
        res.status(500).json({ error: "Failed to process chat intent" });
    }
}

module.exports = {
    getFinancialSummary,
    handleLilyChat
};