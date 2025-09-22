// Common TypeScript types shared by frontend & backend

export type Product = {
  id: string;
  name: string;
  price: number;
  options?: string[];
  imageUrl: string;
};

export type USPBlock = {
  items: string[];
};

export type DetailGridBlock = {
  images: { src: string; caption: string }[];
};

export type CTASection = {
  text: string;
};

export type ProductDetailPage = {
  headline: string;
  heroImage: string;
  usp: USPBlock;
  detailGrid: DetailGridBlock;
  cta: CTASection;
};

