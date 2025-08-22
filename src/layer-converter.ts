export class LayerConverter {
    static convert(text: string): string {
        text = text.replace(/@layer\s+\w+\s*{\s*}/g, '');
        text = text.replace(
            /@layer\s+utilities\s*{([^}]+)}/g,
            (match, content) => `@utility {${content}}`
        );

        // Keep components layer as-is without injecting comments
        text = text.replace(
            /@layer\s+components\s*{/g,
            '@layer components {'
        );

        return text;
    }
}