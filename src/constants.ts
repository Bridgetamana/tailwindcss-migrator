export const DEFAULT_CONFIG = {
    autoConvert: false,
    showDiff: true,
    preserveComments: true
};

export const TAILWIND_V3_DIRECTIVES = [
    '@tailwind base',
    '@tailwind components', 
    '@tailwind utilities'
] as const;

export const TAILWIND_V4_IMPORTS = [
    '@import "tailwindcss";'
];

export const SUPPORTED_LANGUAGES = ["css", "scss", "sass", "less", "postcss"];

export const OKLCH_REGEX = /oklch\(([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+(?:deg)?)(?:\s*\/\s*([\d.]+%?))?\)/g;
export const HSL_REGEX = /hsl\(([\d.]+(?:deg)?)\s+([\d.]+%)\s+([\d.]+%)(?:\s*\/\s*([\d.]+%?))?\)/g;