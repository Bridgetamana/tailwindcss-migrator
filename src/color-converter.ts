export class ColorConverter {
    private static HSL_TO_OKLCH_MAP = new Map<string, string>();

    static hslToOklch(hslValue: string): string {
        if (this.HSL_TO_OKLCH_MAP.has(hslValue)) {
            return this.HSL_TO_OKLCH_MAP.get(hslValue)!;
        }
        const [h, s, l] = hslValue.split(/\s+/).map(parseFloat);
        const sNormalized = s / 100;
        const lNormalized = l / 100;
        const rgb = this.hslToRgb(h, sNormalized, lNormalized);
        const linearRgb = [
            this.srgbToLinearRgb(rgb[0]),
            this.srgbToLinearRgb(rgb[1]),
            this.srgbToLinearRgb(rgb[2])
        ] as [number, number, number];
        const oklab = this.linearRgbToOklab(linearRgb);
        const oklch = this.oklabToOklch(oklab);
        const result = `oklch(${oklch[0].toFixed(4)} ${oklch[1].toFixed(4)} ${oklch[2].toFixed(2)})`;
        this.HSL_TO_OKLCH_MAP.set(hslValue, result);
        return result;
    }

    private static hslToRgb(h: number, s: number, l: number): [number, number, number] {
        const a = s * Math.min(l, 1 - l);
        const f = (n: number, k = (n + h / 30) % 12) => {
            return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        };
        return [f(0), f(8), f(4)];
    }

    private static srgbToLinearRgb(val: number): number {
        return val <= 0.04045 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    }

    private static linearRgbToOklab(rgb: [number, number, number]): [number, number, number] {
        const [r, g, b] = rgb;
        const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
        const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
        const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

        const l_ = Math.cbrt(l);
        const m_ = Math.cbrt(m);
        const s_ = Math.cbrt(s);

        return [
            0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
            1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
            0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
        ];
    }

    private static oklabToOklch(lab: [number, number, number]): [number, number, number] {
        const [L, a, b] = lab;
        const C = Math.sqrt(a * a + b * b);
        const h = (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
        return [L, C, h];
    }
}