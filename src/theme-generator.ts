export class ThemeGenerator {
    static generate(lightVars: Record<string, string>, darkVars: Record<string, string>): string {
        if (Object.keys(lightVars).length === 0 && Object.keys(darkVars).length === 0) {
            return '';
        }

        let themeContent = '@theme inline {\n';

        Object.entries(lightVars).forEach(([varName, value]) => {
            themeContent += `  ${varName}: ${value};\n`;
        });
        themeContent += '}';
        return themeContent;
    }
}