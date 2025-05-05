import { ColorConverter } from './color-converter';

export class ThemeGenerator {
    static generate(lightVars: Record<string, string>, darkVars: Record<string, string>): string {
        let themeContent = '@theme {\n';
        
        // Light variables
        Object.entries(lightVars).forEach(([name, value]) => {
            const convertedValue = this.convertValue(name, value);
            themeContent += `  ${name}: ${convertedValue};\n`;
        });
        
        // Dark variables
        if (Object.keys(darkVars).length > 0) {
            themeContent += '\n  .dark {\n';
            Object.entries(darkVars).forEach(([name, value]) => {
                const convertedValue = this.convertValue(name, value);
                themeContent += `    ${name}: ${convertedValue};\n`;
            });
            themeContent += '  }\n';
        }
        
        themeContent += '}';
        return themeContent;
    }

    private static convertValue(name: string, value: string): string {
        if (name.includes('color') && value.match(/\d+%/)) {
            return ColorConverter.hslToOklch(value);
        }
        return value;
    }
}