<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import Eyebrow from '$lib/components/Eyebrow.svelte';
	import Rink from '$lib/components/Rink.svelte';
	import KPI from '$lib/components/KPI.svelte';
	import Tag from '$lib/components/Tag.svelte';
	import Pill from '$lib/components/Pill.svelte';
	import { api, endpoints } from '$lib/api';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	let skaterId = 8471214; // Ovi
	let goalieId = 8468685; // Lundqvist
	let sQ = 'Ovechkin';
	let gQ = 'Lundqvist';
	let sSuggestions: any[] = [];
	let gSuggestions: any[] = [];

	let data: any = null;
	let loading = false;
	let gameType: 'all' | 'regular' | 'playoffs' = 'all';

	$: gameType = (($page.url.searchParams.get('game_type') as any) ?? 'all') as any;
	$: skaterParam = Number($page.url.searchParams.get('skater') ?? '0');
	$: goalieParam = Number($page.url.searchParams.get('goalie') ?? '0');
	$: if (skaterParam) skaterId = skaterParam;
	$: if (goalieParam) goalieId = goalieParam;

	function setGameType(v: 'all' | 'regular' | 'playoffs') {
		const params = new URLSearchParams($page.url.searchParams);
		if (v === 'all') params.delete('game_type');
		else params.set('game_type', v);
		goto(`/versus?${params.toString()}`, { keepFocus: true, noScroll: true });
	}

	async function fetchVersus() {
		loading = true;
		try {
			const qs: Record<string, string> = {};
			if (gameType && gameType !== 'all') qs.game_type = gameType;
			data = await api<any>(endpoints.versus(skaterId, goalieId, qs));
		} catch (e) {
			data = null;
		} finally {
			loading = false;
		}
	}
	$: if (browser) { skaterId; goalieId; gameType; fetchVersus(); }

	async function search(q: string, side: 'skater' | 'goalie') {
		if (q.length < 2) return;
		const res = await api<any>(endpoints.playerSearch(q));
		if (side === 'skater') sSuggestions = res.results.filter((p: any) => p.position !== 'G');
		else gSuggestions = res.results.filter((p: any) => p.position === 'G');
	}
	function pick(side: 'skater' | 'goalie', p: any) {
		if (side === 'skater') {
			skaterId = p.id;
			sQ = p.last_name;
			sSuggestions = [];
		} else {
			goalieId = p.id;
			gQ = p.last_name;
			gSuggestions = [];
		}
		fetchVersus();
	}

	const fmt = (n: number) => n.toLocaleString('en-US');

	$: maxGoals = data ? Math.max(...data.weapon.map((x: any) => x.goals), 1) : 1;
	$: maxShots = data ? Math.max(...data.weapon.map((x: any) => x.total), 1) : 1;

	$: byPeriodMap = (() => {
		if (!data) return {} as Record<number, number>;
		const m: Record<number, number> = {};
		for (const r of data.by_period) m[r.period] = r.goals;
		return m;
	})();

	function mirrorX(x: number) { return x < 0 ? -x : x; }
	function mirrorY(x: number, y: number) { return x < 0 ? -y : y; }

	function goalDescription(g: any): string {
		const shot = g.shot_type ? String(g.shot_type) : '';
		const assists = Array.isArray(g.assists) ? g.assists.filter(Boolean) : [];
		const strength: string = g.strength ?? '';
		const periodType: string = g.period_type ?? '';
		const isOT = periodType === 'OT' || (typeof g.period === 'number' && g.period >= 4);

		// Strength detection: e.g. "5v4", "5v3", "4v3" => PP, "4v5", "3v5" => SH
		const m = /^(\d)v(\d)$/.exec(strength);
		let situation = '';
		if (m) {
			const a = Number(m[1]);
			const b = Number(m[2]);
			if (a > b) situation = 'Power play';
			else if (a < b) situation = 'Short-handed';
		}

		if (isOT) {
			return shot ? `OT winner · ${shot}` : 'OT winner';
		}
		if (situation) {
			return shot ? `${situation} · ${shot}` : situation;
		}
		if (assists.length) {
			const shotLabel = shot ? `${shot}` : 'Goal';
			return `${shotLabel} · A: ${assists.join(', ')}`;
		}
		return shot || '—';
	}

	let sortMode: 'chrono' | 'shot' = 'chrono';
	$: sortedGoalLog = (() => {
		if (!data?.goal_log) return [];
		if (sortMode === 'shot') {
			return [...data.goal_log].sort((a: any, b: any) =>
				String(a.shot_type ?? '').localeCompare(String(b.shot_type ?? ''))
			);
		}
		return data.goal_log;
	})();
</script>

<svelte:head><title>Versus · ANHLS</title></svelte:head>

<TopNav active="versus" />

<div class="border-b border-line px-12 py-3 font-mono text-[10px] tracking-[1.2px] text-dim">
	VERSUS / {data ? `${data.skater.last_name.toUpperCase()} VS ${data.goalie.last_name.toUpperCase()}` : '…'}
	{#if data}/ {data.totals.seasons ?? 0} SEASONS · {data.totals.shots} SHOTS · {data.totals.goals} GOALS{/if}
</div>

<div class="grid items-center gap-6 border-b border-line bg-bgDeep px-12 py-4" style="grid-template-columns: 1fr 80px 1fr;">
	<div class="relative">
		<input bind:value={sQ} on:input={() => search(sQ, 'skater')} class="w-full rounded-md border border-line bg-panel px-3 py-2 font-body text-[13px] text-ink" placeholder="Skater" />
		{#if sSuggestions.length}
			<div class="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border border-line bg-panel">
				{#each sSuggestions as s}
					<button class="block w-full px-3 py-2 text-left text-[13px] text-ink hover:bg-panel2" on:click={() => pick('skater', s)}>
						{s.full_name} <span class="font-mono text-[10px] text-dim">#{s.id} · {s.position}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
	<div class="text-center font-display text-[24px] text-dim">×</div>
	<div class="relative">
		<input bind:value={gQ} on:input={() => search(gQ, 'goalie')} class="w-full rounded-md border border-line bg-panel px-3 py-2 font-body text-[13px] text-ink" placeholder="Goalie" />
		{#if gSuggestions.length}
			<div class="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border border-line bg-panel">
				{#each gSuggestions as s}
					<button class="block w-full px-3 py-2 text-left text-[13px] text-ink hover:bg-panel2" on:click={() => pick('goalie', s)}>
						{s.full_name} <span class="font-mono text-[10px] text-dim">#{s.id} · {s.position}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

{#if loading}
	<div class="py-16 text-center text-dim">Loading…</div>
{:else if data}
	{@const empty = (data.totals?.shots ?? 0) === 0 && (data.totals?.goals ?? 0) === 0}
	<div class="grid items-stretch border-b border-line" style="grid-template-columns: 1fr 80px 1fr;">
		<div class="flex flex-row items-center gap-8 px-12 py-10">
			<div class="relative w-[120px] flex-shrink-0 rounded-md border border-line bg-panel" style="aspect-ratio: 4/5; background-image: linear-gradient(135deg, #161b25 0%, #070910 100%);">
				<div class="absolute inset-0 flex items-center justify-center font-display text-[64px] font-semibold text-red">{data.skater.sweater_number ?? '—'}</div>
			</div>
			<div class="flex-1 text-left">
				<div class="mb-2.5 flex gap-2">
					<Tag>{data.skater.team_abbrev ?? data.skater.position}</Tag>
					<Tag color="#ec3a3a">{data.skater.is_active ? 'ACTIVE' : 'RETIRED'}</Tag>
				</div>
				<div class="mb-1 font-body text-[14px] text-dim2">{data.skater.first_name}</div>
				<div class="font-display text-[76px] font-medium leading-[0.9] tracking-[-2px] text-ink">{data.skater.last_name}</div>
			</div>
		</div>
		<div class="flex items-center justify-center border-l border-r border-line bg-bgDeep">
			<div class="text-center">
				<div class="font-mono text-[9px] tracking-[1.6px] text-dim">VS</div>
				<div class="mt-1 font-display text-[56px] leading-none tracking-[-1px] text-dim2">×</div>
			</div>
		</div>
		<div class="flex flex-row-reverse items-center gap-8 px-12 py-10">
			<div class="relative w-[120px] flex-shrink-0 rounded-md border border-line bg-panel" style="aspect-ratio: 4/5; background-image: linear-gradient(135deg, #161b25 0%, #070910 100%);">
				<div class="absolute inset-0 flex items-center justify-center font-display text-[64px] font-semibold text-ice">{data.goalie.sweater_number ?? '—'}</div>
			</div>
			<div class="flex-1 text-right">
				<div class="mb-2.5 flex justify-end gap-2">
					<Tag>{data.goalie.team_abbrev ?? data.goalie.position}</Tag>
					<Tag color="#6dc9ff">{data.goalie.is_active ? 'ACTIVE' : 'RETIRED'}</Tag>
				</div>
				<div class="mb-1 font-body text-[14px] text-dim2">{data.goalie.first_name}</div>
				<div class="font-display text-[76px] font-medium leading-[0.9] tracking-[-2px] text-ink">{data.goalie.last_name}</div>
			</div>
		</div>
	</div>

	{#if empty}
		<div class="border-b border-line px-12 pb-14 pt-14">
			<Eyebrow>No record of a matchup</Eyebrow>
			<div class="mt-4 max-w-[1080px] font-display text-[56px] font-medium leading-[1.05] tracking-[-1px] text-ink">
				{data.skater.last_name} <span class="text-dim">never put a shot on</span> {data.goalie.last_name}.
			</div>
			<div class="mt-5 max-w-[760px] text-[14px] leading-[1.65] text-dim2">
				Our play-by-play ledger has no shots, goals, or misses from {data.skater.first_name} {data.skater.last_name} against {data.goalie.first_name} {data.goalie.last_name}{gameType !== 'all' ? ` under the ${gameType === 'regular' ? 'regular-season' : 'playoff'} filter` : ''}. The most common reasons:
				<ul class="mt-3 list-inside list-disc space-y-1 text-dim2 marker:text-faint">
					<li>Their careers never overlapped — pre-2005 play-by-play has only goals and penalties recorded, so older skater-vs-goalie pairings can come up empty even when they shared a season.</li>
					<li>They shared seasons but never played each other under this game-type filter. {#if gameType !== 'all'}Try <button type="button" class="underline-offset-2 hover:underline" on:click={() => setGameType('all')}>switching to Career</button> to include every game.{:else}Try filtering to playoffs or regular season — sometimes the matchup only happened in one of those.{/if}</li>
					<li>One of them is on the wrong roster — double-check you picked a skater on the left and a goalie on the right.</li>
				</ul>
			</div>
			<div class="mt-8 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[1.2px]">
				<span class="rounded-[3px] border border-line px-2 py-[3px] text-dim">SHOTS · 0</span>
				<span class="rounded-[3px] border border-line px-2 py-[3px] text-dim">GOALS · 0</span>
				<span class="rounded-[3px] border border-line px-2 py-[3px] text-dim">SEASONS SHARED · {data.totals?.seasons ?? 0}</span>
			</div>
		</div>
	{:else}
	<div class="grid items-center gap-16 border-b border-line px-12 pb-9 pt-12" style="grid-template-columns: 1fr 1fr;">
		<div>
			<Eyebrow>The matchup, in one sentence</Eyebrow>
			<div class="mt-4 font-display text-[56px] font-medium leading-[1.05] tracking-[-1px] text-ink">
				{data.skater.last_name} fired <span class="text-red">{fmt(data.totals.shots)} shots</span> at {data.goalie.last_name}. Only <span class="text-red">{data.totals.goals}</span> beat him.
			</div>
		</div>
		<div class="grid grid-cols-2 gap-8">
			<KPI value={fmt(data.totals.shots)} label="Shots on goal" />
			<KPI value={fmt(data.totals.goals)} label="Goals scored" accent="#ec3a3a" />
			<KPI value={`${data.totals.conv_pct}%`} label="Conversion rate" />
			<KPI value={`${data.totals.sv_pct}%`} label="Save % against" accent="#6dc9ff" />
			<KPI value={fmt(data.totals.missed)} label="Missed shots" />
			<KPI value={fmt(data.goal_log_total)} label="Goal log entries" />
		</div>
	</div>
	{/if}

	<div class="flex items-center gap-2.5 border-b border-line bg-bgDeep px-12 py-5">
		<span class="mr-3 font-mono text-[10px] tracking-[1.6px] text-dim">FILTERS</span>
		<button type="button" on:click={() => setGameType('all')}>
			<Pill active={gameType === 'all'}>Career</Pill>
		</button>
		<button type="button" on:click={() => setGameType('regular')}>
			<Pill active={gameType === 'regular'}>Reg. season</Pill>
		</button>
		<button type="button" on:click={() => setGameType('playoffs')}>
			<Pill active={gameType === 'playoffs'}>Playoffs</Pill>
		</button>
		<span class="font-mono text-[10px] text-dim">↳ {data.totals.seasons ?? 0} seasons · all situations</span>
		<div class="flex-1"></div>
		<Tag color={empty ? '#7c8595' : '#ec3a3a'}>● {fmt(data.totals.shots)} events matched{gameType !== 'all' ? ` · ${gameType.toUpperCase()}` : ''}</Tag>
	</div>

	{#if !empty}

	<div class="grid" style="grid-template-columns: 1fr 440px;">
		<div class="border-b border-r border-line px-12 py-10">
			<Eyebrow>Where the shots came from</Eyebrow>
			<div class="mt-3 font-display text-[32px] tracking-[-0.5px] text-ink">{data.totals.goals} goals · plotted by puck location</div>
			<div class="relative mt-7">
				<Rink width={880} />
				<svg width="880" height={880 * 85 / 200} viewBox="0 0 200 85" class="absolute inset-0">
					{#each data.shot_map as s}
						{@const x = mirrorX(s.coord_x)}
						{@const y = mirrorY(s.coord_x, s.coord_y)}
						{@const isGoal = s.type_desc === 'goal'}
						{#if isGoal}
							<circle cx={100 + x} cy={42.5 + y} r="2.5" fill="none" stroke="#ec3a3a" stroke-width="0.4" opacity="0.7" />
							<circle cx={100 + x} cy={42.5 + y} r="1.1" fill="#ec3a3a" />
						{:else}
							<circle cx={100 + x} cy={42.5 + y} r="0.6" fill="#6dc9ff" opacity="0.3" />
						{/if}
					{/each}
				</svg>
			</div>
			<div class="mt-6 flex gap-6 font-mono text-[10px] tracking-[0.5px] text-dim2">
				<span><span class="mr-1 text-red">●</span>GOAL · {data.totals.goals}</span>
				<span><span class="mr-1 text-ice">●</span>SAVED · {data.totals.shots - data.totals.goals}</span>
				<span><span class="mr-1 text-dim">●</span>BLOCKED · —</span>
				<span><span class="mr-1 text-faint">○</span>MISSED · {data.totals.missed}</span>
			</div>
		</div>

		<div class="border-b border-line">
			<div class="px-8 pb-5 pt-10">
				<Eyebrow>Weapon of choice</Eyebrow>
				<div class="mt-3 font-display text-[28px] tracking-[-0.5px] text-ink">What worked</div>
			</div>
			<div class="px-8 pb-8">
				{#each data.weapon as w, i}
					<div class="py-3.5" style="border-top: {i > 0 ? '1px solid #13192340' : 'none'}">
						<div class="mb-2 flex items-baseline justify-between">
							<span class="text-[13px] text-ink">{w.shot_type}</span>
							<span class="font-mono text-[11px] text-dim"><span class="text-red">{w.goals}G</span> / {w.total} · {w.pct}%</span>
						</div>
						<div class="flex gap-0.5">
							<div class="h-1 rounded-[2px] bg-red" style:width="{(w.goals / w.total) * 100 * (w.total / maxShots)}%"></div>
							<div class="h-1 rounded-[2px] bg-ice opacity-40" style:width="{((w.total - w.goals) / w.total) * 100 * (w.total / maxShots)}%"></div>
						</div>
					</div>
				{/each}
			</div>

			<div class="border-t border-line px-8 pb-8 pt-6">
				<Eyebrow>When {data.skater.last_name} beat him</Eyebrow>
				<div class="mt-4 grid grid-cols-4 gap-3.5">
					{#each [1, 2, 3, 4] as period}
						<div class="rounded-md border border-line bg-panel p-3.5 text-center">
							<div class="font-mono text-[10px] tracking-[1.4px] text-dim">{period === 4 ? 'OT' : `P${period}`}</div>
							<div class="tnum mt-1 font-display text-[36px] text-red">{byPeriodMap[period] ?? 0}</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<div class="border-b border-line px-12 pb-8 pt-12">
		<div class="mb-8 flex items-end justify-between">
			<div>
				<Eyebrow>The goal log</Eyebrow>
				<div class="mt-3 font-display text-[40px] font-medium tracking-[-0.5px] text-ink">Every one of the {data.totals.goals} goals</div>
			</div>
			<div class="flex gap-2">
				<button type="button" on:click={() => (sortMode = 'chrono')}>
					<Pill active={sortMode === 'chrono'}>Chronological</Pill>
				</button>
				<button type="button" on:click={() => (sortMode = 'shot')}>
					<Pill active={sortMode === 'shot'}>By shot type</Pill>
				</button>
			</div>
		</div>

		<div class="grid border-b border-line py-3 font-mono text-[9px] tracking-[1.4px] text-dim" style="grid-template-columns: 60px 92px 96px 60px 80px 1fr 80px;">
			<span>#</span><span>DATE</span><span>VENUE</span><span>SEASON</span><span>P · CLOCK</span><span>DESCRIPTION</span><span>TYPE</span>
		</div>

		{#each sortedGoalLog as g, i}
			<a
				href={`/game/${g.game_id}`}
				class="grid items-center py-3.5 text-[13px] hover:bg-panel"
				style="grid-template-columns: 60px 92px 96px 60px 80px 1fr 80px; border-bottom: {i < sortedGoalLog.length - 1 ? '1px solid #13192340' : 'none'}"
			>
				<span class="font-mono text-[11px] text-red">{g.n}</span>
				<span class="font-mono text-[11px] text-dim2">{g.date}</span>
				<span class="font-mono text-[11px] text-dim">{g.away_team} @ {g.home_team}</span>
				<span class="font-mono text-[11px] text-dim2">{g.season}</span>
				<span class="font-mono text-[11px] text-dim">P{g.period} · {g.period_time}</span>
				<span class="text-ink2" style="line-height: 1.5;">{goalDescription(g)}</span>
				<Tag color="#ec3a3a">{g.shot_type ?? '—'}</Tag>
			</a>
		{/each}

		{#if sortedGoalLog.length < data.goal_log_total}
			<div class="mt-6 font-mono text-[10px] tracking-[0.8px] text-dim">
				+ {data.goal_log_total - sortedGoalLog.length} more · showing first {sortedGoalLog.length}
			</div>
		{/if}
	</div>
	{/if}
{/if}

<StatusBar note={`query · skater ${skaterId} × goalie ${goalieId} · live`} />
