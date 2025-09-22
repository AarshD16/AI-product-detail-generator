import React from "react";
import { CTASection as CTASectionType } from "@ai/shared";

type Props = CTASectionType;

const CTASection: React.FC<Props> = ({ text }) => {
  return (
    <section className="py-12 px-6 bg-blue-600 text-white text-center rounded-xl mt-12">
      <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
      <p className="mb-6">{text}</p>
      <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold shadow hover:bg-gray-100 transition">
        Buy Now
      </button>
    </section>
  );
};

export default CTASection;
