import React from "react";
import { ProductDetailPage } from "../../../shared/types";
import USPBlock from "./blocks/USPBlock";
import DetailGridBlock from "./blocks/DetailGridBlock";
import CTASection from "./blocks/CTASection";

export default function T1Basic({
  headline,
  heroImage,
  usp,
  detailGrid,
  cta,
}: ProductDetailPage) {
  return (
    <div className="bg-white text-gray-900 w-full">
      {/* Hero */}
      <section className="py-12 px-6 flex flex-col items-center">
        <h1 className="text-4xl font-bold text-blue-600 text-center mb-6">
          {headline}
        </h1>
        <img
          src={heroImage}
          alt="Product"
          className="rounded-xl shadow-lg max-w-md"
        />
      </section>

      {/* USP */}
      <USPBlock {...usp} />

      {/* Detail Grid */}
      <DetailGridBlock {...detailGrid} />

      {/* CTA */}
      <CTASection {...cta} />
    </div>
  );
}
