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
    '@import "tailwindcss/preflight";',
    '@import "tailwindcss";'
];