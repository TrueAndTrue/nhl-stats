<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import Rink from '$lib/components/Rink.svelte';
	import Tag from '$lib/components/Tag.svelte';
	import Panel from '$lib/components/Panel.svelte';
	import Pill from '$lib/components/Pill.svelte';

	export let data: { game: any };
	$: g = data?.game?.game ?? {};
	$: line = (data?.game?.line_score ?? { home: [], away: [] }) as { home: number[]; away: number[] };
	$: pbp = (data?.game?.pbp ?? []) as any[];
	$: scoring = (data?.game?.scoring ?? []) as any[];
	$: penalties = (data?.game?.penalties ?? []) as any[];
	$: perf = (data?.game?.top_performers ?? []) as any[];

	$: homeWon = (g.home_score ?? 0) > (g.away_score ?? 0);
	$: awayWon = (g.away_score ?? 0) > (g.home_score ?? 0);

	const HOME_COLOR = '#ec3a3a';
	const AWAY_COLOR = '#6dc9ff';

	const fmt = (n: number | null) => (n === null ? '—' : n);

	// Period filter state for shot map + PBP
	let periodFilter: 'all' | 1 | 2 | 3 | 4 | 5 = 'all';

	// Game state suffix derivation (OT / SO based on periods reached in pbp)
	$: hasOT = pbp.some((e) => (e.period ?? 0) >= 4);
	$: hasSO = pbp.some((e) => (e.period ?? 0) === 5);
	$: gameStateLabel = (() => {
		const base = g.state ?? 'FINAL';
		const display = base === 'OFF' ? 'FINAL' : base;
		if (hasSO) return `${display} · SO`;
		if (hasOT) return `${display} · OT`;
		return display;
	})();

	// Build a player_id -> team_abbrev map from scoring goals (uses home/away score deltas).
	$: playerTeamMap = (() => {
		const map = new Map<number, string>();
		let prevH = 0;
		let prevA = 0;
		for (const s of scoring) {
			const isHome = (s.home_score ?? 0) > prevH;
			const team = isHome ? g.home_team : g.away_team;
			if (s.primary_id != null) {
				map.set(s.primary_id, team);
			}
			prevH = s.home_score ?? prevH;
			prevA = s.away_score ?? prevA;
		}
		return map;
	})();

	// Derive team abbrev for a single pbp event (best-effort).
	// 1. If it's a goal, use score-delta vs the previous goal.
	// 2. Otherwise look up the player in the goal-derived team map.
	// 3. Fallback: null (will render as neutral).
	function teamForEvent(e: any): string | null {
		if (e.type === 'goal') {
			// Find this entry in scoring order to determine team via delta.
			// Easier: walk scoring once and look up by id.
			const idx = scoring.findIndex((s) => s.id === e.id);
			if (idx >= 0) {
				const prev = idx > 0 ? scoring[idx - 1] : { home_score: 0, away_score: 0 };
				const isHome = (scoring[idx].home_score ?? 0) > (prev.home_score ?? 0);
				return isHome ? g.home_team : g.away_team;
			}
		}
		if (e.primary_id != null && playerTeamMap.has(e.primary_id)) {
			return playerTeamMap.get(e.primary_id) ?? null;
		}
		return null;
	}

	function teamColor(team: string | null): string {
		if (team === g.home_team) return HOME_COLOR;
		if (team === g.away_team) return AWAY_COLOR;
		return '#a4abb8';
	}

	// Determine scoring team for a scoring entry via score-delta sweep.
	$: scoringWithTeam = (() => {
		const out: any[] = [];
		let prevH = 0;
		for (const s of scoring) {
			const isHome = (s.home_score ?? 0) > prevH;
			const team = isHome ? g.home_team : g.away_team;
			// Parse "GOAL — Scorer (assists: A, B)" pattern
			const m = /GOAL\s+[—-]\s+([^()]+?)(?:\s+\(assists?:\s+([^)]+)\))?$/i.exec(s.desc ?? '');
			let scorer = '';
			let assists: string[] = [];
			if (m) {
				scorer = m[1].trim();
				if (m[2]) {
					assists = m[2].split(',').map((a) => a.trim()).filter(Boolean);
				}
			}
			out.push({ ...s, _team: team, _scorer: scorer, _assists: assists });
			prevH = s.home_score ?? prevH;
		}
		return out;
	})();

	// Derive penalty rows with team + player name parsing.
	$: penaltiesWithTeam = penalties.map((pe) => {
		const team = pe.primary_id != null ? playerTeamMap.get(pe.primary_id) ?? null : null;
		// Parse "penalty — Player Name"
		const m = /penalty\s+[—-]\s+(.+)$/i.exec(pe.desc ?? '');
		const player = m ? m[1].trim() : pe.desc;
		return { ...pe, _team: team, _player: player };
	});

	// Filtered pbp by period
	$: filteredPbp = periodFilter === 'all' ? pbp : pbp.filter((e) => e.period === periodFilter);

	// Shot list for the map (with team colour pre-computed)
	$: shotEvents = filteredPbp
		.filter((e) => e.x !== null && e.y !== null && ['shot-on-goal', 'goal', 'missed-shot'].includes(e.type))
		.map((e) => ({ ...e, _team: teamForEvent(e) }));

	let highlightedEvent: string | null = null;

	function focusEvent(id: string) {
		highlightedEvent = id;
		// Wait one tick for DOM
		setTimeout(() => {
			const el = document.getElementById(`pbp-${id}`);
			if (el) {
				el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
			}
		}, 0);
		// Clear highlight after a beat
		setTimeout(() => {
			if (highlightedEvent === id) highlightedEvent = null;
		}, 2400);
	}

	function setPeriod(v: 'all' | 1 | 2 | 3 | 4 | 5) {
		periodFilter = v;
	}

	// Detect whether OT / SO actually have events (for showing those pills only when relevant)
	$: hasP4 = pbp.some((e) => e.period === 4);
	$: hasP5 = pbp.some((e) => e.period === 5);
</script>

<svelte:head><title>Game {g.id} · ANHLS</title></svelte:head>

<TopNav active="games" />

<!-- breadcrumb -->
<div class="flex items-center gap-2.5 border-b border-line px-12 py-3 font-mono text-[10px] tracking-[1.2px] text-dim">
	<a href="/games" class="hover:text-ink">GAMES</a><span class="text-faint">/</span>
	<span class="text-ink2">{g.id}</span>
	<span class="ml-2 text-faint">{g.date} · {g.game_type === 2 ? 'Regular Season' : g.game_type === 3 ? 'Playoff' : g.game_type === 1 ? 'Preseason' : 'All-Star'} · {g.venue ?? '—'}</span>
</div>

<!-- SCOREBOARD -->
<div class="relative overflow-hidden border-b border-line px-8 pb-6 pt-8">
	<div class="pointer-events-none absolute opacity-[0.18]" style="right:-120px; top:-40px">
		<Rink width={700} />
	</div>

	<div class="relative grid items-center gap-6" style="grid-template-columns: 1fr 200px 1fr;">
		<!-- Away -->
		<div class="flex flex-row items-center gap-6">
			<div
				class="flex aspect-square w-24 items-center justify-center border border-line bg-panel font-display text-[44px]"
				style="background-image: repeating-linear-gradient(45deg, transparent 0 8px, #13192340 8px 9px);"
				style:color={awayWon ? '#ec3a3a' : '#a4abb8'}
			>
				{g.away_team}
			</div>
			<div class="text-left">
				<div class="font-mono text-[10px] tracking-[1.4px] text-dim">AWAY · {g.away_team}</div>
				<div class="tnum font-display leading-none tracking-[-2px]" style="font-size:120px" style:color={awayWon ? '#f4f5f7' : '#a4abb8'}>{fmt(g.away_score)}</div>
				<div class="font-mono text-[10px] text-dim">{line.away.reduce((a, b) => a + b, 0)} G total</div>
			</div>
		</div>

		<!-- center -->
		<div class="text-center">
			<Tag color="#a4abb8">{gameStateLabel}</Tag>
			<div class="mt-2.5 font-mono text-[10px] tracking-[1.4px] text-dim">{g.date}</div>
			<div class="mt-0.5 font-mono text-[10px] text-dim">{g.venue ?? ''}</div>
		</div>

		<!-- Home -->
		<div class="flex flex-row-reverse items-center gap-6">
			<div
				class="flex aspect-square w-24 items-center justify-center border border-line bg-panel font-display text-[44px]"
				style="background-image: repeating-linear-gradient(45deg, transparent 0 8px, #13192340 8px 9px);"
				style:color={homeWon ? '#ec3a3a' : '#a4abb8'}
			>
				{g.home_team}
			</div>
			<div class="text-right">
				<div class="font-mono text-[10px] tracking-[1.4px] text-dim">HOME · {g.home_team}</div>
				<div class="tnum font-display leading-none tracking-[-2px]" style="font-size:120px" style:color={homeWon ? '#f4f5f7' : '#a4abb8'}>{fmt(g.home_score)}</div>
				<div class="font-mono text-[10px] text-dim">{line.home.reduce((a, b) => a + b, 0)} G total</div>
			</div>
		</div>
	</div>

	<!-- line score -->
	<div class="mt-7 grid border-b border-t border-line" style="grid-template-columns: 180px repeat(5, 1fr) 120px;">
		{#each ['', 'P1', 'P2', 'P3', 'OT', 'SO', 'TOTAL'] as h, i}
			<div class="px-3 py-2 font-mono text-[10px] tracking-[1.4px] text-dim {i < 6 ? 'border-r border-line' : ''}" style:text-align={i === 0 ? 'left' : 'center'}>{h}</div>
		{/each}
		<!-- Away row -->
		<div class="border-r border-line px-3 py-3 font-mono text-[13px]" style:color={awayWon ? '#f4f5f7' : '#a4abb8'} style="border-top: 1px solid #13192340">
			<span class="mr-1.5 text-ice">●</span>{g.away_team}
		</div>
		{#each [...line.away, line.away.reduce((a, b) => a + b, 0)] as v, i}
			<div class="px-3 py-3 text-center font-display text-[22px] {i < 5 ? 'border-r border-line' : ''}" style:color={i === 5 ? (awayWon ? '#ec3a3a' : '#f4f5f7') : '#a4abb8'} style="border-top: 1px solid #13192340">
				{v || '–'}
			</div>
		{/each}
		<!-- Home row -->
		<div class="border-r border-line px-3 py-3 font-mono text-[13px]" style:color={homeWon ? '#f4f5f7' : '#a4abb8'} style="border-top: 1px solid #13192340">
			<span class="mr-1.5 text-red">●</span>{g.home_team}
		</div>
		{#each [...line.home, line.home.reduce((a, b) => a + b, 0)] as v, i}
			<div class="px-3 py-3 text-center font-display text-[22px] {i < 5 ? 'border-r border-line' : ''}" style:color={i === 5 ? (homeWon ? '#ec3a3a' : '#f4f5f7') : '#a4abb8'} style="border-top: 1px solid #13192340">
				{v || '–'}
			</div>
		{/each}
	</div>
</div>

<!-- MAIN: Shot map + PBP -->
<div class="grid" style="grid-template-columns: 1fr 480px;">
	<Panel
		title="SHOT MAP · ALL EVENTS"
		subtitle={`${shotEvents.filter((e) => ['shot-on-goal', 'goal'].includes(e.type)).length} shots · ${shotEvents.filter((e) => e.type === 'goal').length} goals`}
		class="rounded-none border-0 border-b border-r border-line"
	>
		<svelte:fragment slot="action">
			<Tag color="#ec3a3a" bg="rgba(236,58,58,0.15)">● {g.home_team}</Tag>
			<Tag color="#6dc9ff" bg="rgba(109,201,255,0.15)">● {g.away_team}</Tag>
		</svelte:fragment>
		<div class="p-6">
			<!-- Period filter pills -->
			<div class="mb-4 flex flex-wrap items-center gap-2">
				<span class="mr-1 font-mono text-[10px] tracking-[1.4px] text-dim">PERIOD</span>
				<Pill active={periodFilter === 'all'} onClick={() => setPeriod('all')}>All</Pill>
				<Pill active={periodFilter === 1} onClick={() => setPeriod(1)}>P1</Pill>
				<Pill active={periodFilter === 2} onClick={() => setPeriod(2)}>P2</Pill>
				<Pill active={periodFilter === 3} onClick={() => setPeriod(3)}>P3</Pill>
				{#if hasP4}
					<Pill active={periodFilter === 4} onClick={() => setPeriod(4)}>OT</Pill>
				{/if}
				{#if hasP5}
					<Pill active={periodFilter === 5} onClick={() => setPeriod(5)}>SO</Pill>
				{/if}
			</div>
			<div class="relative">
				<Rink width={920} />
				<svg width="920" height={920 * 85 / 200} viewBox="0 0 200 85" class="absolute inset-0">
					{#each shotEvents as e}
						{@const color = teamColor(e._team)}
						<g on:click={() => focusEvent(e.id)} class="cursor-pointer" role="button" tabindex="0">
							{#if e.type === 'goal'}
								<circle cx={100 + e.x} cy={42.5 + e.y} r="1.4" fill={color} opacity="1" stroke="#fff" stroke-width="0.3" />
								<circle cx={100 + e.x} cy={42.5 + e.y} r="3.5" fill="none" stroke={color} stroke-width="0.4" opacity="0.6" />
							{:else if e.type === 'shot-on-goal'}
								<circle cx={100 + e.x} cy={42.5 + e.y} r="0.6" fill={color} opacity="0.4" />
							{:else}
								<!-- missed-shot -->
								<circle cx={100 + e.x} cy={42.5 + e.y} r="0.6" fill={color} opacity="0.25" />
							{/if}
							<!-- invisible bigger hit target -->
							<circle cx={100 + e.x} cy={42.5 + e.y} r="2.4" fill="transparent" />
						</g>
					{/each}
				</svg>
			</div>
		</div>
	</Panel>

	<Panel title="PLAY-BY-PLAY" subtitle={`${filteredPbp.length} events`} class="rounded-none border-0 border-b border-line">
		<div class="scroll-thin max-h-[760px] overflow-y-auto">
			{#each filteredPbp.slice(0).reverse() as e}
				<div
					id={`pbp-${e.id}`}
					class="grid items-baseline gap-2 px-3.5 py-2 transition-colors"
					style="grid-template-columns: 56px 60px 1fr; border-bottom: 1px solid #13192340;"
					style:background={highlightedEvent === e.id ? 'rgba(236,58,58,0.22)' : e.type === 'goal' ? 'rgba(236,58,58,0.05)' : 'transparent'}
					style:outline={highlightedEvent === e.id ? '1px solid #ec3a3a' : 'none'}
				>
					<div class="font-mono text-[10px] text-dim">
						{e.period === 4 ? 'OT' : e.period === 5 ? 'SO' : `P${e.period ?? '?'}`} {e.period_time ?? ''}
					</div>
					<div class="font-mono text-[9px] tracking-[1.2px]" style:color={e.type === 'goal' ? '#ec3a3a' : e.type === 'penalty' ? '#f3c969' : '#a4abb8'}>
						{(e.type ?? '').toUpperCase().slice(0, 8)}
					</div>
					<div class="text-[11px]" style:color={e.type === 'goal' ? '#f4f5f7' : '#a4abb8'} style="line-height: 1.45;">{e.desc}</div>
				</div>
			{/each}
		</div>
	</Panel>
</div>

<!-- BOTTOM -->
<div class="grid grid-cols-3">
	<Panel title="SCORING SUMMARY" class="rounded-none border-0 border-r border-line">
		<div>
			{#each scoringWithTeam as gle}
				{@const teamCol = teamColor(gle._team)}
				<div class="grid items-center gap-2.5 px-[18px] py-3" style="grid-template-columns: 50px 1fr 70px; border-bottom: 1px solid #13192340;">
					<div>
						<div class="font-mono text-[9px] text-dim">{gle.period === 4 ? 'OT' : gle.period === 5 ? 'SO' : `P${gle.period}`}</div>
						<div class="font-mono text-[11px] text-ink">{gle.period_time}</div>
					</div>
					<div class="min-w-0">
						<div class="mb-1 flex items-center gap-2">
							<Tag color={teamCol} bg={`${teamCol}26`}>{gle._team ?? '—'}</Tag>
							<span class="truncate text-[13px] text-ink" style="font-family: Geist, system-ui, sans-serif;">
								{gle._scorer || gle.desc}
							</span>
						</div>
						{#if gle._assists && gle._assists.length}
							<div class="font-mono text-[10px] text-dim">A: {gle._assists.join(', ')}</div>
						{/if}
					</div>
					<div class="tnum text-right font-display text-[28px] text-ink">{gle.home_score ?? 0}-{gle.away_score ?? 0}</div>
				</div>
			{:else}
				<div class="px-[18px] py-6 text-center font-mono text-[10px] text-dim">no goals</div>
			{/each}
		</div>
	</Panel>

	<Panel title="PENALTIES" class="rounded-none border-0 border-r border-line">
		<div>
			{#each penaltiesWithTeam as pe}
				{@const teamCol = teamColor(pe._team)}
				<div class="grid items-center gap-2.5 px-[18px] py-3" style="grid-template-columns: 50px 1fr 36px; border-bottom: 1px solid #13192340;">
					<div>
						<div class="font-mono text-[9px] text-dim">{pe.period === 4 ? 'OT' : pe.period === 5 ? 'SO' : `P${pe.period}`}</div>
						<div class="font-mono text-[11px] text-ink">{pe.period_time}</div>
					</div>
					<div class="min-w-0">
						<div class="mb-1 flex items-center gap-2">
							<Tag color={teamCol} bg={`${teamCol}26`}>{pe._team ?? '—'}</Tag>
							<span class="truncate text-[12px] text-ink">{pe._player}</span>
						</div>
						<div class="font-mono text-[9px] uppercase tracking-[1.2px] text-dim">{pe.penalty_type ?? ''}</div>
					</div>
					<div class="font-display text-[24px] text-warn">{pe.penalty_minutes ?? 0}<span class="text-[11px] text-dim">m</span></div>
				</div>
			{:else}
				<div class="px-[18px] py-6 text-center font-mono text-[10px] text-dim">no penalties</div>
			{/each}
		</div>
	</Panel>

	<Panel title="BOX · TOP PERFORMERS" class="rounded-none border-0">
		<div class="py-1">
			{#each perf as p}
				{@const pTeam = p.id != null ? playerTeamMap.get(p.id) ?? null : null}
				{@const pCol = teamColor(pTeam)}
				{@const assistsCount = scoringWithTeam.reduce((acc, s) => acc + (s._assists.includes(p.last_name) ? 1 : 0), 0)}
				{@const sogCount = pbp.filter((ev) => ev.primary_id === p.id && ['shot-on-goal', 'goal'].includes(ev.type)).length}
				{@const hitCount = pbp.filter((ev) => ev.primary_id === p.id && ev.type === 'hit').length}
				{@const blkCount = pbp.filter((ev) => ev.primary_id === p.id && ev.type === 'blocked-shot').length}
				{@const fowCount = pbp.filter((ev) => ev.primary_id === p.id && ev.type === 'faceoff').length}
				<a href={`/player/${p.id}`} class="block px-[18px] py-3 hover:bg-panel" style="border-bottom: 1px solid #13192340;">
					<div class="mb-1.5 flex items-baseline justify-between gap-2">
						<div class="flex min-w-0 items-center gap-2">
							{#if pTeam}
								<Tag color={pCol} bg={`${pCol}26`}>{pTeam}</Tag>
							{/if}
							<span class="truncate text-[13px] text-ink">{p.first_name} {p.last_name}</span>
						</div>
						<span class="font-mono text-[10px] text-dim">{p.position}</span>
					</div>
					<div class="flex flex-wrap gap-1.5 font-mono text-[10px]">
						{#if (p.goals ?? 0) > 0}
							<span class="rounded-[3px] border border-red/40 bg-red/10 px-1.5 py-0.5 text-red">{p.goals}G</span>
						{/if}
						{#if assistsCount > 0}
							<span class="rounded-[3px] border border-line bg-panel px-1.5 py-0.5 text-ink2">{assistsCount}A</span>
						{/if}
						{#if sogCount > 0}
							<span class="rounded-[3px] border border-line bg-panel px-1.5 py-0.5 text-dim2">{sogCount}SOG</span>
						{/if}
						{#if hitCount > 0}
							<span class="rounded-[3px] border border-line bg-panel px-1.5 py-0.5 text-dim2">{hitCount}HIT</span>
						{/if}
						{#if blkCount > 0}
							<span class="rounded-[3px] border border-line bg-panel px-1.5 py-0.5 text-dim2">{blkCount}BLK</span>
						{/if}
						{#if fowCount > 0}
							<span class="rounded-[3px] border border-line bg-panel px-1.5 py-0.5 text-dim2">{fowCount}FO</span>
						{/if}
						{#if (p.goals ?? 0) === 0 && assistsCount === 0 && sogCount === 0 && hitCount === 0 && blkCount === 0 && fowCount === 0}
							<span class="text-dim">{p.events} events</span>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	</Panel>
</div>

<StatusBar note={`GAME · ${g.id} · ${pbp.length} events ingested`} />
