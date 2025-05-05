export class LayerConverter {
    static convert(text: string): string {
        text = text.replace(
            /@layer\s+utilities\s*{([^}]+)}/g,
            (match, content) => `@utility {${content}}`
        );
        
        text = text.replace(
            /@layer\s+components\s*{/g,
            `/* Note: In v4, component utilities can be overwritten by other utilities */\n@layer components {`
        );
        
        return text;
    }
}