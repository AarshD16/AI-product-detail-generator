import React from "react";
import { USPBlock as USPBlockType } from "../../../../shared/types";

type Props = USPBlockType;

const USPBlock: React.FC<Props> = ({ items }) => {
  return (
    <section className="py-12 px-6 bg-gray-50">
      <h2 className="text-2xl font-semibold text-center mb-6">
        Why Choose This Product?
      </h2>
      <ul className="list-disc list-inside space-y-3 max-w-md mx-auto text-gray-700">
        {items.map((usp, i) => (
          <li key={i}>{usp}</li>
        ))}
      </ul>
    </section>
  );
};

export default USPBlock;
