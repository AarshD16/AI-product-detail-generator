import React from "react";
import { DetailGridBlock as DetailGridBlockType } from "@ai/shared";

type Props = DetailGridBlockType;

const DetailGridBlock: React.FC<Props> = ({ images }) => {
  return (
    <section className="py-12 px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
      {images.map((img, i) => (
        <div key={i} className="flex flex-col items-center text-center">
          <img
            src={img.src}
            alt={img.caption}
            className="rounded-lg shadow-md max-w-full"
          />
          <p className="mt-4 text-gray-700">{img.caption}</p>
        </div>
      ))}
    </section>
  );
};

export default DetailGridBlock;
