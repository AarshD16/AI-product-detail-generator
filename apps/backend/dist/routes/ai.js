"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const openai_1 = __importDefault(require("openai"));
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const client = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
// Forbidden words list
const forbiddenWords = ["free", "guaranteed", "fake", "scam"];
// Zod schema for validation
const CopySchema = zod_1.z.object({
    headline: zod_1.z.string(),
    usps: zod_1.z.array(zod_1.z.string()).length(3),
    cta: zod_1.z.string(),
});
// POST /ai/copy.generate
router.post("/copy.generate", async (req, res) => {
    const { name, price, options } = req.body;
    try {
        const prompt = `
You are a marketing copywriter. 
Generate a JSON object with a headline, exactly 3 unique selling points (usps), 
and a call-to-action (cta) for this product.

Product name: ${name}
Price: $${price}
Options: ${options?.join(", ") || "N/A"}

Output ONLY valid JSON in this format:
{
  "headline": "...",
  "usps": ["...", "...", "..."],
  "cta": "..."
}
    `;
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });
        const rawText = response.choices[0].message?.content ?? "{}";
        let parsed;
        try {
            parsed = JSON.parse(rawText);
        }
        catch (err) {
            return res.status(500).json({ error: "Invalid JSON from AI", rawText });
        }
        const validation = CopySchema.safeParse(parsed);
        if (!validation.success) {
            return res
                .status(400)
                .json({ error: "Validation failed", issues: validation.error.issues });
        }
        // Guard: filter forbidden words
        const hasForbidden = forbiddenWords.some((word) => JSON.stringify(parsed).toLowerCase().includes(word));
        if (hasForbidden) {
            return res.status(400).json({ error: "Contains forbidden words" });
        }
        return res.json({ copy: parsed });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "AI generation failed" });
    }
});
exports.default = router;
