export class DocumentBuilder {
    static build(themeSection: string, processedContent: string, customVariants: string = ''): string {
        processedContent = processedContent.replace(/@theme\s*{\s*}/g, '');
        if (processedContent.includes('@theme {')) {
            processedContent = processedContent.replace(/@theme\s*{[\s\S]*?}/, '');
        }
        const fontImports = processedContent.match(/@import\s+url\([^;]+\);?\s*/g)?.join('\n') || '';
        processedContent = processedContent.replace(/@import\s+url\([^;]+\);?\s*/g, '');
        const tailwindImports = '@import "tailwindcss";';
        processedContent = processedContent.replace(/@import\s+"tailwindcss[^"]*";?\s*/g, '');
        processedContent = processedContent.replace(/@layer\s+\w+\s*{\s*}/g, '');

        return [
            fontImports,
            tailwindImports,
            customVariants,  // Add custom variants here, right after tailwind import
            themeSection,
            processedContent
        ].filter(Boolean).join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
    }
}