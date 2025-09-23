"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderTemplate = renderTemplate;
const puppeteer_1 = __importDefault(require("puppeteer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const sharp_1 = __importDefault(require("sharp"));
const archiver_1 = __importDefault(require("archiver"));
const outputDir = path_1.default.join(__dirname, "../renders");
if (!fs_1.default.existsSync(outputDir)) {
    fs_1.default.mkdirSync(outputDir, { recursive: true });
}
async function renderTemplate(data, jobId) {
    const browser = await puppeteer_1.default.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 750, height: 1200 });
    const uspItems = data.usp?.items ?? [];
    const gridImages = data.detailGrid?.images ?? [];
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Render</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      </head>
      <body class="bg-white">
        <div class="w-full max-w-[750px] mx-auto">
          <h1 class="text-3xl font-bold text-center text-blue-600 my-6">${data.headline}</h1>
          <img src="${data.heroImage}" class="mx-auto rounded-xl shadow-lg max-w-md" id="hero" />

          <section class="my-6 px-6">
            <ul class="list-disc space-y-2">
              ${uspItems.map((u) => `<li>${u}</li>`).join("")}
            </ul>
          </section>

          <section class="grid grid-cols-2 gap-4 my-6 px-6">
            ${gridImages
        .map((img) => `
                  <div class="flex flex-col items-center">
                    <img src="${img.src}" class="rounded-md" />
                    <p class="text-sm mt-2">${img.caption}</p>
                  </div>`)
        .join("")}
          </section>

          <section class="bg-blue-600 text-white text-center py-8">
            <h2 class="text-xl font-semibold">${data.cta?.text ?? ""}</h2>
          </section>
        </div>
      </body>
    </html>
  `;
    await page.setContent(html, { waitUntil: "networkidle0" });
    const jobName = jobId || `render-${Date.now()}`;
    const fullImagePath = path_1.default.join(outputDir, `${jobName}.webp`);
    // Full screenshot optimized to WebP
    const screenshotBuffer = await page.screenshot({
        fullPage: true,
    });
    await (0, sharp_1.default)(screenshotBuffer).webp({ quality: 80 }).toFile(fullImagePath);
    // Get dimensions
    const meta = await (0, sharp_1.default)(fullImagePath).metadata();
    const height = meta.height || 0;
    const sliceHeight = 2000;
    const slices = [];
    const sliceDir = path_1.default.join(outputDir, jobName);
    if (!fs_1.default.existsSync(sliceDir))
        fs_1.default.mkdirSync(sliceDir);
    let sliceIndex = 0;
    for (let top = 0; top < height; top += sliceHeight) {
        const slicePath = path_1.default.join(sliceDir, `slice-${sliceIndex}.webp`);
        await (0, sharp_1.default)(fullImagePath)
            .extract({
            left: 0,
            top,
            width: meta.width,
            height: Math.min(sliceHeight, height - top),
        })
            .webp({ quality: 80 })
            .toFile(slicePath);
        slices.push(slicePath);
        sliceIndex++;
    }
    // Make ZIP of slices
    const zipPath = path_1.default.join(outputDir, `${jobName}.zip`);
    await new Promise((resolve, reject) => {
        const output = fs_1.default.createWriteStream(zipPath);
        const archive = (0, archiver_1.default)("zip");
        output.on("close", () => resolve());
        archive.on("error", (err) => reject(err));
        archive.pipe(output);
        slices.forEach((file) => {
            archive.file(file, { name: path_1.default.basename(file) });
        });
        archive.finalize();
    });
    // Create square thumbnail (crop from hero area at top)
    const thumbnailPath = path_1.default.join(outputDir, `${jobName}-thumb.webp`);
    await (0, sharp_1.default)(fullImagePath)
        .resize(400, 400, { fit: "cover" })
        .toFile(thumbnailPath);
    await browser.close();
    return { slices, zipPath, fullImagePath, thumbnailPath };
}
