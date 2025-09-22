"use client";
import React, { useState } from "react";
import T1Basic from "../componet/template/T1Basic"; // 👈 adjust path if needed
import Preview from "./preview"; // 👈 import Preview component
import { ProductDetailPage } from "@ai/shared";



type CopyResponse = {
  headline: string;
  usps: string[];
  cta: string;
};

export default function Home() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [options, setOptions] = useState("");
  const [image, setImage] = useState<File | null>(null);

  // --- Render outputs ---
  const [preview, setPreview] = useState<string | null>(null);
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  const [fullUrl, setFullUrl] = useState<string | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  const [copy, setCopy] = useState<CopyResponse | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRendered, setShowRendered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) {
      alert("Please upload an image");
      return;
    }
    setLoading(true);

    try {
      // --- Upload image ---
      const formData = new FormData();
      formData.append("image", image);

      const uploadRes = await fetch("http://localhost:4000/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      const imgUrl = `http://localhost:4000/api${uploadData.imageUrl}`;
      setUploadedImageUrl(imgUrl);

      // --- Save product ---
      await fetch("http://localhost:4000/api/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: parseFloat(price),
          options: options.split(",").map((opt) => opt.trim()),
          imageUrl: imgUrl,
        }),
      });

      // --- AI Copy ---
      const copyRes = await fetch("http://localhost:4000/api/ai/copy.generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: parseFloat(price),
          options: options.split(",").map((opt) => opt.trim()),
        }),
      });
      const copyData = await copyRes.json();
      setCopy(copyData.copy);

      // --- Render final ---
      const renderRes = await fetch("http://localhost:4000/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: copyData.copy.headline,
          heroImage: imgUrl,
          usp: { items: copyData.copy.usps },
          detailGrid: {
            images: [
              { src: imgUrl, caption: "Detail A" },
              { src: imgUrl, caption: "Detail B" },
            ],
          },
          cta: { text: copyData.copy.cta },
        }),
      });

      const renderData = await renderRes.json();

      // Expecting backend to return: { preview, zipUrl, fullUrl, thumbUrl }
      setPreview(renderData.preview || null);
      setZipUrl(renderData.zipUrl ? `http://localhost:4000/api${renderData.zipUrl}` : null);
      setFullUrl(renderData.fullUrl ? `http://localhost:4000/api${renderData.fullUrl}` : null);
      setThumbUrl(renderData.thumbUrl ? `http://localhost:4000/api${renderData.thumbUrl}` : null);
    } catch (err) {
      console.error(err);
      alert("Something went wrong during render.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-extrabold text-center text-gray-100 mb-6">
        Product Input Form
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 shadow-lg rounded-2xl p-6 space-y-4"
      >
        <div>
          <label className="block text-sm font-semibold text-gray-300">Product Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full mt-1 p-2 border border-gray-700 rounded-lg bg-gray-900 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
            placeholder="Enter product name"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300">Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="w-full mt-1 p-2 border border-gray-700 rounded-lg bg-gray-900 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300">
            Options (comma separated)
          </label>
          <input
            type="text"
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-700 rounded-lg bg-gray-900 text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300">Upload Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="mt-1 text-gray-200"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:opacity-90 transition"
        >
          {loading ? "Generating..." : "Submit"}
        </button>
      </form>

      {/* --- Live Template Preview --- */}
      {copy && uploadedImageUrl && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-100 mb-6 text-center">
            Live Template Preview
          </h2>
          <T1Basic
            headline={copy.headline}
            heroImage={uploadedImageUrl}
            usp={{ items: copy.usps }}
            detailGrid={{
              images: [
                { src: uploadedImageUrl, caption: "Detail A" },
                { src: uploadedImageUrl, caption: "Detail B" },
              ],
            }}
            cta={{ text: copy.cta }}
          />

          {/* Button to show rendered preview */}
          {fullUrl && (
            <div className="text-center mt-6">
              <button
                onClick={() => setShowRendered(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow hover:opacity-90 transition"
              >
                View Rendered Version
              </button>
            </div>
          )}

          {/* Use Preview component */}
          {showRendered && (
            <Preview
              preview={preview}
              fullUrl={fullUrl}
              zipUrl={zipUrl}
              thumbUrl={thumbUrl}
            />
          )}
      </div>
    )}
    </div> 
  )}
