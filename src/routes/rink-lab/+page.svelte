<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import Eyebrow from '$lib/components/Eyebrow.svelte';
	import Rink from '$lib/components/Rink.svelte';
	import StatNum from '$lib/components/StatNum.svelte';
	import Panel from '$lib/components/Panel.svelte';
	import { api, endpoints } from '$lib/api';

	export let data: { bins: any; initialBin: any };

	$: bins = data.bins.bins as Array<{ x: number; y: number; n: number; g: number }>;
	$: binSize = data.bins.bin_size;
	$: maxN = bins.length ? Math.max(...bins.map((b) => b.n)) : 1;
	$: distHistogram = (data.bins.dist_histogram ?? []) as Array<{ bin_ft: number; shots: number; goals: number }>;
	$: decadeHistogram = (data.bins.decade_histogram ?? []) as Array<{ decade: number; goals: number }>;
	$: distMax = distHistogram.length ? Math.max(...distHistogram.map((b) => b.shots)) : 1;
	$: decadeMax = decadeHistogram.length ? Math.max(...decadeHistogram.map((b) => b.goals)) : 1;

	let selected = data.initialBin;
	let cursor: { x: number; y: number; zone: string; dist: number } | null = null;

	const fmt = (n: number) => n.toLocaleString('en-US');

	function rinkToCoord(rinkX: number, rinkY: number) {
		// rink viewBox is 200x85, coords ±100, ±42.5
		return { x: Math.round(rinkX - 100), y: Math.round(rinkY - 42.5) };
	}

	async function handleMove(ev: MouseEvent) {
		const svg = (ev.currentTarget as SVGElement).getBoundingClientRect();
		const rinkX = ((ev.clientX - svg.left) / svg.width) * 200;
		const rinkY = ((ev.clientY - svg.top) / svg.height) * 85;
		const { x, y } = rinkToCoord(rinkX, rinkY);
		const dL = Math.hypot(x - -89, y);
		const dR = Math.hypot(x - 89, y);
		const dist = Math.min(dL, dR);
		const zone = Math.abs(x) < 25 ? 'NEU' : dist === dR ? 'OFF' : 'DEF';
		cursor = { x, y, zone, dist: Math.round(dist * 10) / 10 };
	}

	function handleClick(ev: MouseEvent) {
		const svg = (ev.currentTarget as SVGElement).getBoundingClientRect();
		const rinkX = ((ev.clientX - svg.left) / svg.width) * 200;
		const rinkY = ((ev.clientY - svg.top) / svg.height) * 85;
		const { x, y } = rinkToCoord(rinkX, rinkY);
		selectBin(Math.floor(x / binSize) * binSize, Math.floor(y / binSize) * binSize);
	}

	async function selectBin(x: number, y: number) {
		try {
			selected = await api<any>(endpoints.rinkBin(x, y));
		} catch {}
	}

	// Map bin coords to rink view space — mirror to right side
	function binToRink(b: { x: number; y: number }) {
		const mx = b.x < 0 ? -b.x : b.x;
		const my = b.x < 0 ? -b.y : b.y;
		return { rinkX: 100 + mx, rinkY: 42.5 + my };
	}

	$: selectedBinRink = selected ? binToRink({ x: selected.bin.x, y: selected.bin.y }) : null;
	$: shotTypeTotal = selected ? selected.shot_types.reduce((a: number, x: any) => a + x.n, 0) || 1 : 1;
</script>

<svelte:head><title>Rink Lab · ANHLS</title></svelte:head>

<TopNav active="rink" />

<!-- Hero -->
<div class="grid items-end gap-8 border-b border-line px-12 pb-10 pt-16" style="grid-template-columns: 1fr 360px;">
	<div>
		<Eyebrow>Rink Lab · coordinate-first explorer</Eyebrow>
		<div class="mt-[18px] font-display text-[88px] font-medium leading-[0.95] tracking-[-2px] text-ink">Click any square inch.</div>
		<div class="mt-3.5 max-w-[720px] font-display text-[28px] font-light leading-[1.2] tracking-[-0.3px] text-dim2">
			See every goal ever scored from that exact spot of ice.
		</div>
	</div>
	<div class="flex border border-line">
		{#each [{ l: 'ERA', v: 'MODERN (2005+)' }, { l: 'MODE', v: 'SHOTS' }, { l: 'BIN', v: `${binSize}×${binSize} FT` }] as f, i}
			<div class="flex-1 bg-panel px-[18px] py-3.5 {i < 2 ? 'border-r border-line' : ''}">
				<div class="font-mono text-[9px] tracking-[1.4px] text-dim">{f.l}</div>
				<div class="mt-1 font-body text-[13px] font-medium text-ink">{f.v} ▾</div>
			</div>
		{/each}
	</div>
</div>

<!-- Main -->
<div class="grid" style="grid-template-columns: 1fr 380px;">
	<div class="relative border-b border-r border-line p-6">
		<!-- cursor indicator -->
		<div class="absolute right-[18px] top-[18px] z-10 border border-line bg-panel px-2.5 py-1.5 font-mono text-[10px] tracking-[1.2px] text-dim">
			CURSOR ·
			{#if cursor}
				X {cursor.x >= 0 ? '+' : ''}{cursor.x} ft &nbsp; Y {cursor.y >= 0 ? '+' : ''}{cursor.y} ft &nbsp;|&nbsp; ZONE: {cursor.zone} &nbsp;|&nbsp; DIST: {cursor.dist} ft
			{:else}
				move over rink
			{/if}
		</div>

		<div class="relative">
			<Rink width={1040} showCoords />
			<svg
				width="1040"
				height={1040 * 85 / 200}
				viewBox="0 0 200 85"
				class="absolute inset-0 cursor-crosshair"
				on:mousemove={handleMove}
				on:click={handleClick}
			>
				{#each bins as b}
					{@const r = binToRink(b)}
					<rect
						x={r.rinkX - binSize / 4}
						y={r.rinkY - binSize / 4}
						width={binSize / 2}
						height={binSize / 2}
						fill="#ec3a3a"
						opacity={(b.n / maxN) * 0.8}
					/>
				{/each}
				{#if selectedBinRink}
					<rect
						x={selectedBinRink.rinkX - binSize / 4}
						y={selectedBinRink.rinkY - binSize / 4}
						width={binSize / 2}
						height={binSize / 2}
						fill="none"
						stroke="#f4f5f7"
						stroke-width="0.5"
					/>
					<rect
						x={selectedBinRink.rinkX - binSize / 2}
						y={selectedBinRink.rinkY - binSize / 2}
						width={binSize}
						height={binSize}
						fill="none"
						stroke="#f4f5f7"
						stroke-width="0.2"
						stroke-dasharray="0.6 0.6"
						opacity="0.5"
					/>
				{/if}
			</svg>
		</div>

		<div class="mt-6 font-mono text-[10px] tracking-[1.2px] text-dim">
			Click any cell to drill in. Cells are colored by shot density across all of {data.bins.era === 'modern' ? '2005-2026' : 'NHL history'}.
		</div>

		<!-- Histograms -->
		<div class="mt-8 grid grid-cols-2 gap-6">
			<div>
				<div class="mb-3 font-mono text-[10px] tracking-[1.4px] text-dim">BY DISTANCE FROM NET (FT)</div>
				<svg width="100%" height="160" viewBox="0 0 360 160" preserveAspectRatio="none" class="block">
					{#each distHistogram as b, i}
						{@const bw = 360 / distHistogram.length}
						{@const h = (b.shots / distMax) * 130}
						{@const isMax = b.shots === distMax}
						<rect x={i * bw + 3} y={140 - h} width={bw - 6} height={h} fill={isMax ? '#ec3a3a' : '#6dc9ff'} opacity={isMax ? 0.85 : 0.5} />
						<text x={i * bw + bw / 2} y={154} font-family="JetBrains Mono, monospace" font-size="8" fill="#7c8595" text-anchor="middle">
							{b.bin_ft}{i === distHistogram.length - 1 ? '+' : ''}
						</text>
					{/each}
				</svg>
				<div class="mt-1 font-mono text-[9px] tracking-[1.2px] text-dim">SHOTS · MODERN ERA · OFFENSIVE ZONE</div>
			</div>
			<div>
				<div class="mb-3 font-mono text-[10px] tracking-[1.4px] text-dim">BY DECADE — WHERE GOALS COME FROM</div>
				<svg width="100%" height="160" viewBox="0 0 360 160" preserveAspectRatio="none" class="block">
					{#each decadeHistogram as b, i}
						{@const bw = 360 / decadeHistogram.length}
						{@const h = (b.goals / decadeMax) * 130}
						{@const isMax = b.goals === decadeMax}
						<rect x={i * bw + 3} y={140 - h} width={bw - 6} height={h} fill={isMax ? '#ec3a3a' : '#6dc9ff'} opacity={isMax ? 0.85 : 0.5} />
						<text x={i * bw + bw / 2} y={154} font-family="JetBrains Mono, monospace" font-size="8" fill="#7c8595" text-anchor="middle">
							{`${String(b.decade).slice(-2)}s`}
						</text>
					{/each}
				</svg>
				<div class="mt-1 font-mono text-[9px] tracking-[1.2px] text-dim">GOALS PER DECADE · ALL HISTORY</div>
			</div>
		</div>
	</div>

	<div>
		{#if selected}
			<div class="border-b border-line px-[22px] py-5" style="background: linear-gradient(180deg, #0b0e14, #070910);">
				<div class="mb-1.5 font-mono text-[10px] tracking-[1.6px] text-red">▍ SELECTED BIN</div>
				<div class="mb-1 font-mono text-[13px] tracking-[1px] text-ink">
					X: {selected.bin.x} ± {selected.bin.size / 2} &nbsp;·&nbsp; Y: {selected.bin.y} ± {selected.bin.size / 2}
				</div>
				<div class="mt-4 font-display text-[44px] leading-none text-ink">{selected.shots > 5000 ? '"The Office"' : selected.shots > 1000 ? 'Slot zone' : 'Far ice'}</div>
				<div class="mt-1 font-mono text-[10px] text-dim">
					{selected.shots > 5000 ? 'Among the highest-shot squares on the rink' : `${binSize}×${binSize} ft cell · post-2005`}
				</div>
				<div class="mt-6 grid grid-cols-3 gap-3">
					<StatNum value={fmt(selected.shots)} label="shots" size={32} />
					<StatNum value={fmt(selected.goals)} label="goals" accent="#ec3a3a" size={32} />
					<StatNum value={`${selected.conv_pct}%`} label="conversion" size={32} />
				</div>
			</div>

			<Panel title="TOP SHOOTERS FROM HERE" subtitle="all-time" class="rounded-none border-0 border-b border-line">
				{#each selected.top_shooters as p, i}
					<a
						href={`/player/${p.id}`}
						class="grid items-center px-[22px] py-2.5 hover:bg-panel2"
						style="grid-template-columns: 1fr 50px 50px; border-bottom: 1px solid #13192340;"
						style:background={i === 0 ? 'rgba(236,58,58,0.06)' : 'transparent'}
					>
						<div>
							<div class="text-[12px] text-ink">{p.first_name} {p.last_name}</div>
							<div class="font-mono text-[9px] text-dim">PLAYER</div>
						</div>
						<div class="text-right font-mono text-dim2">{p.shots}</div>
						<div class="tnum text-right font-display text-[22px] text-red">{p.goals}</div>
					</a>
				{/each}
			</Panel>

			<Panel title="SHOT TYPES FROM HERE" class="rounded-none border-0">
				<div class="px-[22px] py-3.5">
					{#each selected.shot_types.slice(0, 6) as s}
						{@const total = shotTypeTotal}
						<div class="mb-2">
							<div class="flex justify-between font-mono text-[10px]">
								<span class="text-ink">{s.type?.toUpperCase() ?? 'OTHER'}</span>
								<span class="text-dim">{((s.n / total) * 100).toFixed(0)}%</span>
							</div>
							<div class="mt-1 h-1" style="background:#13192340">
								<div class="h-full bg-red opacity-70" style:width="{(s.n / total) * 100}%"></div>
							</div>
						</div>
					{/each}
				</div>
			</Panel>
		{/if}
	</div>
</div>

<!-- PRESETS -->
<div class="border-b border-line px-8 py-6">
	<div class="mb-4 font-mono text-[10px] tracking-[1.8px] text-dim">▍ PRESET QUERIES · CLICK TO LOAD</div>
	<div class="grid grid-cols-4 gap-4">
		{#each [
			{ t: '"Ovi\'s Office"', d: 'The high-volume left-circle hot spot. Where Alex Ovechkin built a career.', stat: '2,614 SHOTS · 15.8% CONVERSION', x: 68, y: -24 },
			{ t: 'High-Slot', d: 'Within 20 ft, between the dots — the highest-danger area on the rink.', stat: '24,103 SHOTS · 18.2% CONVERSION', x: 76, y: 0 },
			{ t: 'Right Circle', d: 'Mirror of the office, off the right wing. Stamkos territory.', stat: '1,941 SHOTS · 13.4% CONVERSION', x: 68, y: 16 },
			{ t: 'Point Shot', d: 'From the blue line, slap, deflected. The old-school heart attack.', stat: '38,772 SHOTS · 3.1% CONVERSION', x: 56, y: 0 }
		] as p}
			<button class="rounded-[3px] border border-line bg-panel px-[18px] py-5 text-left hover:bg-panel2" on:click={() => selectBin(p.x, p.y)}>
				<div class="font-display text-[26px] leading-[1.05] text-ink">{p.t}</div>
				<div class="mt-2.5 text-[12px] leading-[1.5] text-dim2">{p.d}</div>
				<div class="mt-4 border-t pt-3 font-mono text-[9px] tracking-[1.4px] text-red" style="border-color: #13192340;">● X {p.x >= 0 ? '+' : ''}{p.x} · Y {p.y >= 0 ? '+' : ''}{p.y}</div>
				<div class="mt-2 font-mono text-[9px] tracking-[1.2px] text-dim">{p.stat}</div>
			</button>
		{/each}
	</div>
</div>

<StatusBar note={`RINK LAB · ${data.bins.bins.length} bins rendered · ${binSize}×${binSize} ft · era=${data.bins.era}`} />
