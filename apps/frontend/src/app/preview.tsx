"use client";
import React from "react";

interface PreviewProps {
  preview?: string | null;   // base64 image
  fullUrl?: string | null;   // full image download
  zipUrl?: string | null;    // slices zip
  thumbUrl?: string | null;  // thumbnail
}

export default function Preview({ preview, fullUrl, zipUrl, thumbUrl }: PreviewProps) {
  if (!preview) return null;

  return (
    <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-100 mb-6 text-center">
            Rendered Product Preview
        </h2>

        {/* Mockup frame with hover zoom */}
        <div className="relative group max-w-3xl mx-auto overflow-hidden rounded-2xl shadow-2xl border border-gray-700 bg-gray-800">
            <img
            src={preview}
            alt="Rendered Product"
            className="w-full transform transition-transform duration-500 group-hover:scale-105"
            />

            {/* Subtle overlay on hover */}
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Download buttons */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            {fullUrl && (
            <a
                href={fullUrl}
                download
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg shadow hover:opacity-90 transition text-center"
            >
                Download Full Image
            </a>
            )}
            {zipUrl && (
            <a
                href={zipUrl}
                download
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg shadow hover:opacity-90 transition text-center"
            >
                Download Slices (ZIP)
            </a>
            )}
            {thumbUrl && (
            <a
                href={thumbUrl}
                download
                className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg shadow hover:opacity-90 transition text-center"
            >
                Download Thumbnail
            </a>
            )}
        </div>
    </div>

  );
}
