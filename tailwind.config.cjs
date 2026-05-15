/** @type {import('tailwindcss').Config} */
const config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			colors: {
				// surfaces
				bg: '#0b0e14',
				bgDeep: '#070910',
				panel: '#11151d',
				panel2: '#161b25',
				panel3: '#1c2230',
				// hairlines
				line: '#1a2030',
				lineSoft: '#13192340',
				lineHard: '#222a3a',
				// ink
				ink: '#f4f5f7',
				ink2: '#cfd3da',
				dim: '#7c8595',
				dim2: '#a4abb8',
				faint: '#4a5160',
				// accents
				red: '#ec3a3a',
				redDim: 'rgba(236,58,58,0.15)',
				redGlow: 'rgba(236,58,58,0.06)',
				ice: '#6dc9ff',
				iceDim: 'rgba(109,201,255,0.15)',
				warn: '#f3c969',
				ok: '#8de2a8'
			},
			fontFamily: {
				display: ['Antonio', 'sans-serif'],
				body: ['Geist', 'system-ui', 'sans-serif'],
				mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
			}
		}
	},
	plugins: []
};

module.exports = config;
