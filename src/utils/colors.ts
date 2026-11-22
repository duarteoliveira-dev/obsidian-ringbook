const GOLDEN_ANGLE = 137.508;

// Used for the following folders when the base color has no hue (white, grey, black).
const FALLBACK_SATURATION = 0.65;
const FALLBACK_LIGHTNESS = 0.55;

interface Hsl {
	h: number; // 0-360
	s: number; // 0-1
	l: number; // 0-1
}

function hexToHsl(hex: string): Hsl {
	const r = parseInt(hex.slice(1, 3), 16) / 255;
	const g = parseInt(hex.slice(3, 5), 16) / 255;
	const b = parseInt(hex.slice(5, 7), 16) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	const d = max - min;
	if (d === 0) return { h: 0, s: 0, l };

	const s = d / (1 - Math.abs(2 * l - 1));
	let h: number;
	if (max === r) h = ((g - b) / d) % 6;
	else if (max === g) h = (b - r) / d + 2;
	else h = (r - g) / d + 4;
	return { h: (h * 60 + 360) % 360, s, l };
}

function hslToHex({ h, s, l }: Hsl): string {
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;
	const [r, g, b] =
		h < 60 ? [c, x, 0]
		: h < 120 ? [x, c, 0]
		: h < 180 ? [0, c, x]
		: h < 240 ? [0, x, c]
		: h < 300 ? [x, 0, c]
		: [c, 0, x];
	const toHex = (v: number) =>
		Math.round((v + m) * 255)
			.toString(16)
			.padStart(2, '0');
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Color for the folder at `index` (0 = first folder). Index 0 is the base
 * color itself; each following folder rotates the hue by the golden angle,
 * which keeps neighbours distinct for any number of folders.
 */
export function colorForIndex(baseHex: string, index: number): string {
	if (index === 0) return baseHex;

	const base = hexToHsl(baseHex);
	const hasHue = base.s > 0.05;
	return hslToHex({
		h: (base.h + index * GOLDEN_ANGLE) % 360,
		s: hasHue ? base.s : FALLBACK_SATURATION,
		l: hasHue ? base.l : FALLBACK_LIGHTNESS,
	});
}
