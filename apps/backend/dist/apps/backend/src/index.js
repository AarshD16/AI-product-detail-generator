"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const cors_1 = __importDefault(require("cors"));
const openai_1 = __importDefault(require("openai"));
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const render_1 = require("./render");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
app.use(express_1.default.json());
// ✅ Allow frontend requests
app.use((0, cors_1.default)({
    origin: "http://localhost:3000", // your frontend
    methods: ["GET", "POST"],
}));
// Ensure uploads folder exists
const uploadDir = path_1.default.join(__dirname, "../uploads");
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Multer setup
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
// Health check (optional but nice)
app.get("/", (req, res) => {
    res.send("Backend API is running 🚀");
});
// Image upload + resize API
app.post("/upload", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const filename = `${Date.now()}-${req.file.originalname}`;
        const outputPath = path_1.default.join(uploadDir, filename);
        await (0, sharp_1.default)(req.file.buffer).resize({ width: 750 }).toFile(outputPath);
        return res.json({ imageUrl: `/uploads/${filename}` });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Image processing failed" });
    }
});
// Serve static images
app.use("/uploads", express_1.default.static(uploadDir));
// Product submission
app.post("/product", (req, res) => {
    const { name, price, options, imageUrl } = req.body;
    return res.json({
        success: true,
        product: { name, price, options, imageUrl },
    });
});
const client = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
// Forbidden words list
const forbiddenWords = ["free", "guaranteed", "fake", "scam"];
// Schema for validating AI output
const CopySchema = zod_1.z.object({
    headline: zod_1.z.string(),
    usps: zod_1.z.array(zod_1.z.string()).length(3),
    cta: zod_1.z.string(),
});
app.post("/ai/copy.generate", async (req, res) => {
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
        // Guard forbidden words
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
app.post("/render", async (req, res) => {
    try {
        const data = req.body;
        const jobId = `job-${Date.now()}`;
        const { slices, zipPath, fullImagePath, thumbnailPath } = await (0, render_1.renderTemplate)(data, jobId);
        // Serve renders statically
        app.use("/renders", express_1.default.static(path_1.default.join(__dirname, "../renders")));
        // Preview = first slice (inline base64 for quick view)
        const firstSlice = slices[0];
        const buffer = fs_1.default.readFileSync(firstSlice);
        res.json({
            preview: `data:image/webp;base64,${buffer.toString("base64")}`,
            zipUrl: `/renders/${path_1.default.basename(zipPath)}`,
            fullUrl: `/renders/${path_1.default.basename(fullImagePath)}`, // ✅ renamed
            thumbUrl: `/renders/${path_1.default.basename(thumbnailPath)}`, // ✅ renamed + URL
        });
    }
    catch (err) {
        console.error("Render failed:", err);
        res.status(500).json({ error: "Render failed" });
    }
});
app.listen(port, () => {
    console.log(`Backend running at http://localhost:${port}`);
});
