import express from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import cors from "cors";
import OpenAI from "openai";
import { z } from "zod";
import dotenv from "dotenv";
import { renderTemplate } from "./render";


dotenv.config();
const app = express();
const port = process.env.BACKEND_PORT || 4000;

app.use(express.json());

// ✅ Allow frontend requests
app.use(
  cors({
    origin: "http://localhost:3000", // your frontend
    methods: ["GET", "POST"],
  })
);

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

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
    const outputPath = path.join(uploadDir, filename);

    await sharp(req.file.buffer).resize({ width: 750 }).toFile(outputPath);

    return res.json({ imageUrl: `/uploads/${filename}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Image processing failed" });
  }
});

// Serve static images
app.use("/uploads", express.static(uploadDir));

// Product submission
app.post("/product", (req, res) => {
  const { name, price, options, imageUrl } = req.body;
  return res.json({
    success: true,
    product: { name, price, options, imageUrl },
  });
});

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Forbidden words list
const forbiddenWords = ["free", "guaranteed", "fake", "scam"];

// Schema for validating AI output
const CopySchema = z.object({
  headline: z.string(),
  usps: z.array(z.string()).length(3),
  cta: z.string(),
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
    } catch (err) {
      return res.status(500).json({ error: "Invalid JSON from AI", rawText });
    }

    const validation = CopySchema.safeParse(parsed);
    if (!validation.success) {
      return res
        .status(400)
        .json({ error: "Validation failed", issues: validation.error.issues });
    }

    // Guard forbidden words
    const hasForbidden = forbiddenWords.some((word) =>
      JSON.stringify(parsed).toLowerCase().includes(word)
    );

    if (hasForbidden) {
      return res.status(400).json({ error: "Contains forbidden words" });
    }

    return res.json({ copy: parsed });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI generation failed" });
  }
});

app.post("/render", async (req, res) => {
  try {
    const data = req.body;
    const jobId = `job-${Date.now()}`;

    const { slices, zipPath, fullImagePath, thumbnailPath } =
      await renderTemplate(data, jobId);

    // Serve renders statically
    app.use("/renders", express.static(path.join(__dirname, "../renders")));

    // Preview = first slice (inline base64 for quick view)
    const firstSlice = slices[0];
    const buffer = fs.readFileSync(firstSlice);

    res.json({
      preview: `data:image/webp;base64,${buffer.toString("base64")}`,
      zipUrl: `/renders/${path.basename(zipPath)}`,
      fullUrl: `/renders/${path.basename(fullImagePath)}`,   // ✅ renamed
      thumbUrl: `/renders/${path.basename(thumbnailPath)}`,  // ✅ renamed + URL
    });
  } catch (err) {
    console.error("Render failed:", err);
    res.status(500).json({ error: "Render failed" });
  }
});


app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
