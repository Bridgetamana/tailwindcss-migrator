import { ThemeGenerator } from './theme-generator';
import { LayerConverter } from './layer-converter';
import { DocumentBuilder } from './document-builder';
import { ColorConverter } from './color-converter';

export class TailwindMigrator {
    static async convert(text: string, useOklch: boolean = true, customRules: Array<{pattern: string, replacement: string}> = []): Promise<string> {
        text = this.cleanExistingV4Artifacts(text);
        text = this.replaceDirectives(text);
        if (Array.isArray(customRules)) {
            for (const rule of customRules) {
                try {
                    const regex = new RegExp(rule.pattern, 'g');
                    text = text.replace(regex, rule.replacement);
                } catch (e) {
                    console.error(`Invalid custom rule: ${rule.pattern}`, e);
                }
            }
        }
        const { lightVars, darkVars, processedText, hasDarkMode } = this.extractThemeVariables(text, useOklch);

        const themeSection = ThemeGenerator.generate(lightVars, darkVars);

        let customVariants = '';
        if (hasDarkMode) {
            customVariants = '@custom-variant dark (&:is(.dark *));';
        }

        const convertedText = LayerConverter.convert(processedText);
        return DocumentBuilder.build(themeSection, convertedText, customVariants);
    }

    private static cleanExistingV4Artifacts(text: string): string {
        return text
            .replace(/@theme\s*{\s*}/g, '')
            .replace(/@custom-variant\s+dark\s+\(&:is\(\.dark\s+\*\)\);/g, '')
            .replace(/@theme\s*inline\s*{\s*}/g, '')
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
            '@import "tailwindcss";',
            text
        ].filter(Boolean).join('\n\n');
    }

    private static extractThemeVariables(text: string, useOklch: boolean = true) {
        const lightVars: Record<string, string> = {};
        const darkVars: Record<string, string> = {};
        let processedText = text;
        let hasDarkMode = false;

        const baseLayerRootDarkRegex = /@layer\s+base\s*{[\s\S]*?:root\s*{([^}]+)}[\s\S]*?\.dark\s*{([^}]+)}[\s\S]*?}/;
        const baseLayerRootDarkMatch = text.match(baseLayerRootDarkRegex);

        if (baseLayerRootDarkMatch) {
            hasDarkMode = true;
            const rootContent = baseLayerRootDarkMatch[1];
            const darkContent = baseLayerRootDarkMatch[2];

            const rootVars = this.processVariableDeclarations(rootContent);
            Object.entries(rootVars).forEach(([varName, value]) => {
                lightVars[`--color-${varName.substring(2)}`] = `var(${varName})`;
            });

            const darkVarsObj = this.processVariableDeclarations(darkContent);
            Object.entries(darkVarsObj).forEach(([varName, value]) => {
                darkVars[`--color-${varName.substring(2)}`] = `var(${varName})`;
            });

            const rootBlock = `:root {\n  ${Object.entries(rootVars).map(([k, v]) =>
                `${k}: ${this.formatColorValue(v, useOklch)};`).join('\n  ')}\n}`;
            const darkBlock = `\n\n.dark {\n  ${Object.entries(darkVarsObj).map(([k, v]) =>
                `${k}: ${this.formatColorValue(v, useOklch)};`).join('\n  ')}\n}`;

            processedText = processedText.replace(baseLayerRootDarkRegex, `${rootBlock}${darkBlock}`);
        } else {
            const baseLayerRootRegex = /@layer\s+base\s*{[\s\S]*?:root\s*{([^}]+)}[\s\S]*?}/;
            const baseLayerRootMatch = text.match(baseLayerRootRegex);

            if (baseLayerRootMatch) {
                const rootContent = baseLayerRootMatch[1];
                const rootVars = this.processVariableDeclarations(rootContent);
                Object.entries(rootVars).forEach(([varName, value]) => {
                    lightVars[`--color-${varName.substring(2)}`] = `var(${varName})`;
                });

                const rootBlock = `:root {\n  ${Object.entries(rootVars).map(([k, v]) =>
                    `${k}: ${this.formatColorValue(v, useOklch)};`).join('\n  ')}\n}`;

                processedText = processedText.replace(baseLayerRootRegex, rootBlock);
            }
        }

        const standaloneRootMatch = processedText.match(/:root\s*{([^}]+)}/);
        if (standaloneRootMatch) {
            const rootVars = this.processVariableDeclarations(standaloneRootMatch[1]);
            Object.entries(rootVars).forEach(([varName, value]) => {
                lightVars[`--color-${varName.substring(2)}`] = `var(${varName})`;
            });
        }

        const standaloneDarkMatch = processedText.match(/\.dark\s*{([^}]+)}/);
        if (standaloneDarkMatch) {
            hasDarkMode = true;
            const darkVarsObj = this.processVariableDeclarations(standaloneDarkMatch[1]);
            Object.entries(darkVarsObj).forEach(([varName, value]) => {
                darkVars[`--color-${varName.substring(2)}`] = `var(${varName})`;
            });
        }

        return { lightVars, darkVars, processedText, hasDarkMode };
    }

    private static processVariableDeclarations(content: string): Record<string, string> {
        const vars: Record<string, string> = {};
        content.split(';').forEach(declaration => {
            const parts = declaration.split(':').map(s => s.trim());
            if (parts.length === 2 && parts[0] && parts[0].startsWith('--')) {
                vars[parts[0]] = parts[1];
            }
        });
        return vars;
    }

    private static formatColorValue(value: string, useOklch: boolean = true): string {
        if (value.trim().match(/^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/)) {
            if (useOklch) {
                try {
                    return ColorConverter.hslToOklch(value);
                } catch (e) {
                    return `hsl(${value})`;
                }
            } else {
                return `hsl(${value})`;
            }
        }
        return value;
    }
}