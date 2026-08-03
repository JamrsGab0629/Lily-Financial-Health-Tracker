const financialService = require("../services/financialService");
const fuzzyEngine = require("../utils/fuzzyEngine"); // 👈 Import fuzzyEngine

async function getFinancialSummary(req, res) {
    try {
        const summary = await financialService.getFinancialSummary();

        // 1. Calculate expense ratio safely
        const rawRatio = summary.expenseRatio || summary.spendRatio || 0;

        // 2. Run Fuzzy Logic evaluation
        const { dominantTier, memberships } = fuzzyEngine.getDominantFuzzyTier(rawRatio);
        const healthScore = fuzzyEngine.calculateHealthScore(memberships);

        // 3. Map Lily's status & emotion based on dominant tier
        const moodMap = {
            veryLow:  { status: "Excellent", emotion: "very_happy", emoji: "😸", message: "Your finances look incredible!" },
            low:      { status: "Good",      emotion: "happy",      emoji: "😺", message: "Your spending is well under control!" },
            moderate: { status: "Moderate",  emotion: "happy",      emoji: "🐱", message: "Keep an eye on non-essential spending." },
            high:     { status: "Warning",   emotion: "sad",        emoji: "😿", message: "Expenses are creeping up high!" },
            veryHigh: { status: "Critical",  emotion: "angry",      emoji: "😾", message: "Spending is exceeding safe limits!" }
        };

        const lilyState = moodMap[dominantTier] || moodMap.moderate;

        // 4. Return summary with healthScore and normalized keys
        res.status(200).json({
            ...summary,
            totalExpenses: summary.totalExpense ?? summary.totalExpenses ?? 0, // 👈 Fix key naming (expenses vs expense)
            healthScore: healthScore,                                           // 👈 Attach score (0 - 100)
            lily: lilyState                                                    // 👈 Attach Lily's state object
        });

    } catch (error) {
        console.error("Error calculating financial summary:", error);

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