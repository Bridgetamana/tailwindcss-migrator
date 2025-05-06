import { ColorConverter } from './color-converter';
import { ThemeGenerator } from './theme-generator';
import { LayerConverter } from './layer-converter';
import { DocumentBuilder } from './document-builder';

export class TailwindMigrator {
    static async convert(text: string): Promise<string> {
        text = this.cleanExistingV4Artifacts(text);
        text = this.replaceDirectives(text);
        const { lightVars, darkVars } = this.extractThemeVariables(text);
        text = this.removeOriginalVars(text);
        const themeSection = ThemeGenerator.generate(lightVars, darkVars);
        text = LayerConverter.convert(text);
        return DocumentBuilder.build(themeSection, text);
    }

    private static cleanExistingV4Artifacts(text: string): string {
        return text
            .replace(/@theme\s*{\s*}/g, '')
            .replace(/@import\s+"tailwindcss[^"]*";?\s*/g, '')
            .replace(/@layer\s+\w+\s*{\s*}/g, '');
    }

    private static replaceDirectives(text: string): string {
        const fontImports = text.match(/@import\s+url\([^;]+\);?\s*/g)?.join('\n') || '';
        text = text.replace(/@import\s+url\([^;]+\);?\s*/g, '');

        text = text
            .replace(/@tailwind\s+base[^;]*;?/g, '')
            .replace(/@tailwind\s+components[^;]*;?/g, '')
            .replace(/@tailwind\s+utilities[^;]*;?/g, '');

        return [
            fontImports,
            '@import "tailwindcss/preflight";',
            '@import "tailwindcss";',
            text
        ].filter(Boolean).join('\n\n');
    }

    private static extractThemeVariables(text: string) {
        const lightVars: Record<string, string> = {};
        const darkVars: Record<string, string> = {};
        const rootMatch = text.match(/:root\s*{([^}]+)}/);
        if (rootMatch) {
            rootMatch[1].split(';').forEach(declaration => {
                const [varName, value] = declaration.split(':').map(s => s.trim());
                if (varName && value) {
                    lightVars[varName.replace('--', '--color-')] = value;
                }
            });
        }

        const darkMatch = text.match(/\.dark\s*{([^}]+)}/);
        if (darkMatch) {
            darkMatch[1].split(';').forEach(declaration => {
                const [varName, value] = declaration.split(':').map(s => s.trim());
                if (varName && value) {
                    darkVars[varName.replace('--', '--color-')] = value;
                }
            });
        }

        return { lightVars, darkVars };
    }

    private static removeOriginalVars(text: string): string {
        return text
            .replace(/:root\s*{[^}]+}/, '')
            .replace(/\.dark\s*{[^}]+}/, '');
    }
}