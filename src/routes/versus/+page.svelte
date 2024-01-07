<script lang="ts">
	import { Input, Button, Dropdown, DropdownItem, ButtonGroup, Spinner } from 'flowbite-svelte';
	import avatarEmpty from '$lib/images/avatar-empty.png';
	let apiBaseUrl = '' as any;
	const ENV = import.meta.env.VITE_NODE_ENV;
	ENV == 'dev'
		? (apiBaseUrl = 'http://127.0.0.1:8000')
		: (apiBaseUrl = import.meta.env.VITE_NHL_API_BASE_URL);
	const apiFindPlayersByName = import.meta.env.VITE_NHL_API_FIND_PLAYERS_BY_NAME_URL;
	const apiPlayerVsPlayer = import.meta.env.VITE_NHL_API_PLAYER_VERSUS_PLAYER;
	const apiPlayerVsGoalie = import.meta.env.VITE_NHL_API_PLAYER_VERSUS_GOALIE;

	let invalidChoice = '';
	let player1 = {} as any;
	let player1Input = '';
	let player1List = [] as any[];
	let player1Image = avatarEmpty;

	let player2 = {} as any;
	let player2Input = '';
	let player2List = [] as any[];
	let player2Image = avatarEmpty;

	let playerStats = {} as any;

	let isLoading = false;

	const handlePlayerLookup = async (name: string, playerNum: number) => {
		if (playerNum === 1) {
			const response = await fetch(`${apiBaseUrl}${apiFindPlayersByName}?name=${name}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include'
			});
			const data = await response.json();
			player1List = data.players.slice(0, 5);
		} else if (playerNum === 2) {
			const response = await fetch(`${apiBaseUrl}${apiFindPlayersByName}?name=${name}`);
			const data = await response.json();
			player2List = data.players.slice(0, 5);
		} else {
			throw new Error('Invalid player number');
		}
	};

	const handlePlayerSelect = (player: any, playerNum: number) => {
		if (playerNum === 1 && player.primary_position == 'G') {
			invalidChoice = 'Player 1 cannot be a goalie';
			return;
		}
		if (playerNum === 2 && player.primary_position !== 'G') {
			invalidChoice = 'Player 2 must be a goalie';
			return;
		}
		if (playerNum === 1) {
			player1 = player;
			player1Input = '';
			player1List = [];
			player1Image = player.headshot;
			if (player1.primary_position == 'R' || player1.primary_position == 'L') {
				player1.primary_position += 'W';
			}
		} else if (playerNum === 2) {
			player2 = player;
			player2Input = '';
			player2List = [];
			player2Image = player.headshot;
			if (player2.primary_position == 'R' || player2.primary_position == 'L') {
				player2.primary_position += 'W';
			}
		} else {
			throw new Error('Invalid player number');
		}
	};

	const statMapping: Record<string, string> = {
		blocked_shots: 'Blocked Shots',
		missed_shots: 'Missed Shots',
		shots: 'Shots',
		penalties: 'Penalties',
		hits: 'Hits',
		faceoff_wins: 'Faceoff Wins',
		giveaways: 'Giveaways',
		goals: 'Goals',
		score_percentage: 'Scoring Percentage',
		most_common_shot_type: 'Most Common Shot Type'
	};

	const handleReset = () => {
		player1 = {};
		player1Input = '';
		player1List = [];
		player1Image = avatarEmpty;

		player2 = {};
		player2Input = '';
		player2List = [];
		player2Image = avatarEmpty;

		playerStats = {};
	};

	const handleSendQuery = async () => {
		playerStats = {};
		if (Object.keys(player1).length <= 0 || Object.keys(player2).length <= 0) {
			invalidChoice = 'Please select two players';
			return;
		}
		if (player1 && player2) {
			isLoading = true;
			const response =
				player2.primary_position !== 'G'
					? await fetch(
							`${apiBaseUrl}${apiPlayerVsPlayer}?player1=${player1.nhl_api_id}&player2=${player2.nhl_api_id}`
						)
					: await fetch(
							`${apiBaseUrl}${apiPlayerVsGoalie}?player1=${player1.nhl_api_id}&player2=${player2.nhl_api_id}`
						);
			const data = await response.json();
			console.log(data);
			isLoading = false;
			playerStats = data;
		}
	};
</script>

<div
	class="mx-auto mt-4 rounded-xl p-8 text-white shadow-2xl hover:scale-101"
	style="background-color: #1a1a1a; height: 85vh; width: 70vw; box-shadow: 10px 10px 20px #000000, -5px -5px 10px rgba(255, 255, 255, 0.2);"
>
	<div class="relative mb-4 flex items-center justify-center">
		<h1 class="text-4xl font-bold text-gray-100">Player Versus Tool</h1>
		<Button
			class="absolute right-0 rounded-lg bg-red-500 px-4 py-2 font-bold text-white shadow-md hover:bg-red-700"
			on:click={handleReset}
		>
			Reset
		</Button>
	</div>

	<div class="flex h-3/6 flex-row justify-between p-6">
		<!-- Player 1 Container -->
		<div
			class="flex justify-around rounded-xl bg-gray-800 p-4 text-center shadow-md hover:scale-101"
			style="background-color: #1a1a1a; box-shadow: 10px 10px 20px #000000, -5px -5px 10px rgba(255, 255, 255, 0.2); width: 40%;"
		>
			<div>
				<h2 class="mb-4 text-2xl font-bold text-gray-100">
					{#if Object.keys(player1).length > 0}
						{player1.first_name} {player1.last_name}
					{:else}
						Player 1
					{/if}
				</h2>
				<div class="h-[23vh] w-[12vw]">
					<img class="h-full w-full rounded-xl object-cover" src={player1Image} alt="avatar 1" />
				</div>
			</div>
			<div>
				<ButtonGroup class="flex w-full flex-col">
					<Input
						class="mb-4 rounded border-gray-300 text-black"
						placeholder="Find Player"
						bind:value={player1Input}
						on:input={() => handlePlayerLookup(player1Input, 1)}
					/>
					<Dropdown class="w-full">
						{#if player1List.length > 0}
							{#each player1List as player}
								<DropdownItem value={player.id} on:click={() => handlePlayerSelect(player, 1)}
									>{player.first_name} {player.last_name}</DropdownItem
								>
							{/each}
						{/if}
					</Dropdown>
				</ButtonGroup>
				<!-- Additional Player 1 Info -->
				{#if Object.keys(player1).length > 0}
					<div class="align-center mt-2 flex flex-col justify-center font-extrabold text-gray-300">
						<div class="flex items-center justify-center">{player1.height_in_cm} cm</div>
						<div class="flex items-center justify-center">{player1.weight_in_lbs} lbs</div>
						<div class="flex items-center justify-center">{player1.primary_position}</div>
					</div>
				{/if}
			</div>
		</div>

		<div>
			{#if isLoading}
				<div class="flex h-full items-center justify-center">
					<Spinner class="text-white-100 h-12 w-12" color="red" />
				</div>
			{:else}
				<div class="flex h-full items-center justify-center text-3xl font-bold">VS</div>
			{/if}
		</div>

		<!-- Player 2 Container -->
		<div
			class="flex justify-around rounded-xl bg-gray-800 p-4 text-center shadow-md hover:scale-101"
			style="background-color: #1a1a1a; box-shadow: 10px 10px 20px #000000, -5px -5px 10px rgba(255, 255, 255, 0.2); width: 40%;"
		>
			<div>
				<h2 class="mb-4 text-2xl font-bold text-gray-100">
					{#if Object.keys(player2).length > 0}
						{player2.first_name} {player2.last_name}
					{:else}
						Player 2
					{/if}
				</h2>
				<div class="h-[23vh] w-[12vw]">
					<img class="h-full w-full rounded-xl object-cover" src={player2Image} alt="avatar 2" />
				</div>
			</div>
			<div>
				<ButtonGroup class="flex w-full flex-col">
					<Input
						class="mb-4 rounded border-gray-300 text-black"
						placeholder="Find Player"
						bind:value={player2Input}
						on:input={() => handlePlayerLookup(player2Input, 2)}
					/>
					<Dropdown class="w-full">
						{#if player2List.length > 0}
							{#each player2List as player}
								<DropdownItem value={player.id} on:click={() => handlePlayerSelect(player, 2)}
									>{player.first_name} {player.last_name}</DropdownItem
								>
							{/each}
						{/if}
					</Dropdown>
				</ButtonGroup>
				<!-- Additional Player 2 Info -->
				{#if Object.keys(player2).length > 0}
					<div class="align-center mt-2 flex flex-col justify-center font-extrabold text-gray-300">
						<div class="flex items-center justify-center">{player2.height_in_cm} cm</div>
						<div class="flex items-center justify-center">{player2.weight_in_lbs} lbs</div>
						<div class="flex items-center justify-center">{player2.primary_position}</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- STATS CONTAINER -->
	<div
		class="middle-sub-container mx-2 mb-6 rounded-xl bg-gray-700 p-4 shadow-md hover:scale-103"
		style="background-color: #1a1a1a; box-shadow: 10px 10px 20px #000000, -5px -5px 10px rgba(255, 255, 255, 0.2); height: 30%;"
	>
		<div class="align-start h-full justify-around">
			<div class="flex w-full flex-col font-medium">
				<div>
					<h2 class="mb-4 text-center text-2xl font-bold text-gray-100">Stats</h2>
				</div>
				<div class="flex justify-around">
					{#if Object.keys(playerStats).length > 0}
						{#each Object.keys(playerStats) as stat}
							<div class="mt-1 text-gray-300">
								{#if playerStats[stat] !== undefined && playerStats[stat] == null}
									N/A
								{:else}
									<div class="font-extrabold">
										{statMapping[stat]}
									</div>
									<div class="font-medium">
										{playerStats[stat]}
									</div>
								{/if}
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- BUTTON -->
	<div class="text-center">
		<Button
			class="rounded bg-red-500 px-4 py-2 font-bold text-white shadow-lg hover:bg-red-800"
			on:click={handleSendQuery}
		>
			Compare
		</Button>
		{#if invalidChoice}
			<p class="mt-2 text-red-500">{invalidChoice}</p>
		{/if}
	</div>
</div>

<style>
	* {
		flex-shrink: 0;
	}
</style>
