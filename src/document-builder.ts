export class DocumentBuilder {
    static build(themeSection: string, processedContent: string): string {
        // Preserve original imports (fonts, etc.)
        const imports = processedContent.match(/@import\s+url\([^;]+\);?\s*/g)?.join('\n') || '';
        
        processedContent = processedContent.replace(/@import\s+url\([^;]+\);?\s*/g, '');
            processedContent = processedContent
            .replace(/\n{3,}/g, '\n\n')
            .trim();
            return [
            imports,
            themeSection,
            processedContent
        ].filter(Boolean).join('\n\n');
    }
}