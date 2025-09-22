import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import archiver from "archiver";
import { ProductDetailPage } from "@ai/shared/types";

const outputDir = path.join(__dirname, "../renders");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

export async function renderTemplate(
  data: ProductDetailPage,
  jobId?: string
): Promise<{
  slices: string[];
  zipPath: string;
  fullImagePath: string;
  thumbnailPath: string;
}> {
  const browser = await puppeteer.launch({
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
              ${uspItems.map((u: string) => `<li>${u}</li>`).join("")}
            </ul>
          </section>

          <section class="grid grid-cols-2 gap-4 my-6 px-6">
            ${gridImages
              .map(
                (img: any) => `
                  <div class="flex flex-col items-center">
                    <img src="${img.src}" class="rounded-md" />
                    <p class="text-sm mt-2">${img.caption}</p>
                  </div>`
              )
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
  const fullImagePath = path.join(outputDir, `${jobName}.webp`);

  // Full screenshot optimized to WebP
  const screenshotBuffer = await page.screenshot({
    fullPage: true,
  }) as Buffer;

  await sharp(screenshotBuffer).webp({ quality: 80 }).toFile(fullImagePath);

  // Get dimensions
  const meta = await sharp(fullImagePath).metadata();
  const height = meta.height || 0;
  const sliceHeight = 2000;

  const slices: string[] = [];
  const sliceDir = path.join(outputDir, jobName);
  if (!fs.existsSync(sliceDir)) fs.mkdirSync(sliceDir);

  let sliceIndex = 0;
  for (let top = 0; top < height; top += sliceHeight) {
    const slicePath = path.join(sliceDir, `slice-${sliceIndex}.webp`);
    await sharp(fullImagePath)
      .extract({
        left: 0,
        top,
        width: meta.width!,
        height: Math.min(sliceHeight, height - top),
      })
      .webp({ quality: 80 })
      .toFile(slicePath);
    slices.push(slicePath);
    sliceIndex++;
  }

  // Make ZIP of slices
  const zipPath = path.join(outputDir, `${jobName}.zip`);
  await new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip");

    output.on("close", () => resolve());
    archive.on("error", (err) => reject(err));

    archive.pipe(output);
    slices.forEach((file) => {
      archive.file(file, { name: path.basename(file) });
    });
    archive.finalize();
  });

  // Create square thumbnail (crop from hero area at top)
  const thumbnailPath = path.join(outputDir, `${jobName}-thumb.webp`);
  await sharp(fullImagePath)
    .resize(400, 400, { fit: "cover" })
    .toFile(thumbnailPath);

  await browser.close();

  return { slices, zipPath, fullImagePath, thumbnailPath };
}
