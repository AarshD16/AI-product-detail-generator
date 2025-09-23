"use strict";
// Basic design tokens (fonts, spacing, colors)
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokens = void 0;
// export const spacing = {
//   sm: "4px",
//   md: "8px",
//   lg: "16px",
//   xl: "32px",
// };
// export const fonts = {
//   heading: "'Inter', sans-serif",
//   body: "'Roboto', sans-serif",
// };
// export const colors = {
//   primary: "#1a73e8",
//   secondary: "#fbbc04",
//   text: "#333",
//   background: "#fff",
// };
exports.tokens = {
    font: {
        heading: "font-bold text-3xl md:text-5xl",
        subheading: "text-xl md:text-2xl",
        body: "text-base md:text-lg",
    },
    spacing: {
        section: "py-12 px-6",
    },
    colors: {
        primary: "text-blue-600",
        secondary: "text-gray-600",
    },
};
