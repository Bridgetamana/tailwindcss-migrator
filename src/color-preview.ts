import * as vscode from 'vscode';
import { OKLCH_REGEX, HSL_REGEX } from './constants';

function oklchToRgb(l: number, c: number, h: number): { r: number, g: number, b: number } {
    const hRad = h * Math.PI / 180;
    const a = c * Math.cos(hRad);
    const bComponent = c * Math.sin(hRad);
    const L = Math.max(0, Math.min(1, l));
    const l_ = L + 0.3963377774 * a + 0.2158037573 * bComponent;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * bComponent;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * bComponent;
    const l_cubed = Math.max(0, l_) ** 3;
    const m_cubed = Math.max(0, m_) ** 3;
    const s_cubed = Math.max(0, s_) ** 3;
    let r = 4.0767416621 * l_cubed - 3.3077115913 * m_cubed + 0.2309699292 * s_cubed;
    let g = -1.2684380046 * l_cubed + 2.6097574011 * m_cubed - 0.3413193965 * s_cubed;
    let b = -0.0041960863 * l_cubed - 0.7034186147 * m_cubed + 1.7076147010 * s_cubed;
    r = Math.max(0, Math.min(1, r));
    g = Math.max(0, Math.min(1, g));
    b = Math.max(0, Math.min(1, b));
    return { r, g, b };
}

export class ColorProvider implements vscode.DocumentColorProvider {
    provideDocumentColors(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.ColorInformation[]> {
        const colorInfos: vscode.ColorInformation[] = [];

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i);
            const text = line.text;
            OKLCH_REGEX.lastIndex = 0;
            let match: RegExpExecArray | null;
            while ((match = OKLCH_REGEX.exec(text)) !== null) {
                const [fullMatch, l, c, h, a] = match;
                const startPos = new vscode.Position(i, match.index);
                const endPos = new vscode.Position(i, match.index + fullMatch.length);
                const range = new vscode.Range(startPos, endPos);

                try {
                    const lightness = parseFloat(l);
                    const chroma = parseFloat(c);
                    const hue = parseFloat(h);
                    const alpha = a ? parseFloat(a) : 1;
                    const { r, g, b } = oklchToRgb(lightness, chroma, hue);
                    const color = new vscode.Color(r, g, b, alpha);
                    colorInfos.push(new vscode.ColorInformation(range, color));
                } catch (e) {
                    console.error(`Failed to parse OKLCH color: ${fullMatch}`, e);
                }
            }

            HSL_REGEX.lastIndex = 0;
            while ((match = HSL_REGEX.exec(text)) !== null) {
                const [fullMatch, h, s, l, a] = match;
                const startPos = new vscode.Position(i, match.index);
                const endPos = new vscode.Position(i, match.index + fullMatch.length);
                const range = new vscode.Range(startPos, endPos);

                try {
                    const hue = parseFloat(h);
                    const saturation = parseFloat(s.replace('%', ''));
                    const lightness = parseFloat(l.replace('%', ''));
                    const alpha = a ? parseFloat(a.replace('%', '')) / 100 : 1;

                    const color = new vscode.Color(
                        hue / 360,
                        saturation / 100,
                        lightness / 100,
                        alpha
                    );

                    colorInfos.push(new vscode.ColorInformation(range, color));
                } catch (e) {
                    console.error(`Failed to parse HSL color: ${fullMatch}`, e);
                }
            }
        }

        return colorInfos;
    }

    provideColorPresentations(
        color: vscode.Color,
        context: { document: vscode.TextDocument, range: vscode.Range },
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.ColorPresentation[]> {
        const originalText = context.document.getText(context.range);
        return [new vscode.ColorPresentation(originalText)];
    }
}