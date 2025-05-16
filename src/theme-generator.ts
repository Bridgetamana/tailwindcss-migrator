export class ThemeGenerator {
    static generate(lightVars: Record<string, string>, darkVars: Record<string, string>): string {
        if (Object.keys(lightVars).length === 0) {
            return '';
        }

        let themeContent = '@theme {\n';
        if (lightVars['--color-radius']) {
            themeContent += '  --radius-lg: var(--radius);\n';
            themeContent += '  --radius-md: calc(var(--radius) - 2px);\n';
            themeContent += '  --radius-sm: calc(var(--radius) - 4px);\n\n';
        }

        Object.entries(lightVars).forEach(([varName, value]) => {
            themeContent += `  ${varName}: ${value};\n`;
        });
        themeContent += '}';
        return themeContent;
    }
}