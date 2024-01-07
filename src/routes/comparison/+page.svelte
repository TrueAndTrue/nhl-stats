<script lang="ts">
	import { Input, Button, Dropdown, DropdownItem, ButtonGroup, Spinner } from 'flowbite-svelte';
	import avatarEmpty from '$lib/images/avatar-empty.png';
	let apiBaseUrl = '' as any;
	const ENV = import.meta.env.VITE_NODE_ENV;
	ENV == 'dev'
		? (apiBaseUrl = 'http://127.0.0.1:8000')
		: (apiBaseUrl = import.meta.env.VITE_NHL_API_BASE_URL);
	const apiFindPlayersByName = import.meta.env.VITE_NHL_API_FIND_PLAYERS_BY_NAME_URL;
	const apiPlayerComparison = import.meta.env.VITE_NHL_API_PLAYER_COMPARISON_URL;
	const apiGoalieComparison = import.meta.env.VITE_NHL_API_GOALIE_COMPARISON_URL;

	let playerTypes = 0; // 1 = skater, 2 = goalie

	let invalidChoice = "";
	let player1 = {} as any;
	let player1Input = '';
	let player1List = [] as any[];
	let player1Image = avatarEmpty;

	let player2 = {} as any;
	let player2Input = '';
	let player2List = [] as any[];
	let player2Image = avatarEmpty;

	let player1Stats = {} as any;
	let player2Stats = {} as any;

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
		if (player.primary_position == 'G' && playerTypes == 1) {
			invalidChoice = "Cannot compare a goalie to a skater";
			return;
		} else if (player.primary_position != 'G' && playerTypes == 2) {
			invalidChoice = "Cannot compare a goalie to a skater";
			return;
		} else {
			invalidChoice = "";
		}
		player.primary_position == 'G' ? (playerTypes = 2) : (playerTypes = 1);
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
		penalties_drawn: 'Penalties Drawn',
		hits: 'Hits',
		hittees: 'Been Hit',
		faceoff_wins: 'Faceoff Wins',
		faceoff_losses: 'Faceoff Losses',
		giveaways: 'Giveaways',
		goal_count: 'Goals',
		most_common_period: 'Best Scoring Period',
		most_common_shot_type: 'Most Common Goal',
		goals_allowed: 'Goals Against',
		shots_against: 'Shots Against',
		save_percentage: 'Save Percentage',
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

		player1Stats = {};
		player2Stats = {};

		playerTypes = 0;
	}

	const handleSendQuery = async () => {
		player1Stats = {};
		player2Stats = {};
		if (Object.keys(player1).length <= 0 || Object.keys(player2).length <= 0) {
			invalidChoice = "Please select two players";
			return;
		}
		if (player1 && player2) {
			isLoading = true;
			const response = player1.primary_position !== "G" ? await fetch(
				`${apiBaseUrl}${apiPlayerComparison}?player1=${player1.nhl_api_id}&player2=${player2.nhl_api_id}`
			) : await fetch(
				`${apiBaseUrl}${apiGoalieComparison}?player1=${player1.nhl_api_id}&player2=${player2.nhl_api_id}`
			);
			console.log(response);
			const data = await response.json();
			isLoading = false;
			player1Stats = data.player1;
			player2Stats = data.player2;
		}
	};
</script>

<svelte:head>
	<title>Comparison Tool</title>
	<meta name="description" content="Compare any two players from any time in the NHL." />
</svelte:head>

<div class="mx-auto mt-4 rounded-xl p-8 text-white shadow-2xl hover:scale-101" style="background-color: #1a1a1a; height: 85vh; width: 70vw; box-shadow: 10px 10px 20px #000000, -5px -5px 10px rgba(255, 255, 255, 0.2);">
  <div class="relative flex items-center justify-center mb-4">
    <h1 class="text-4xl font-bold text-gray-100">Player Comparison Tool</h1>
    <Button class="absolute right-0 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md" on:click={handleReset}>
      Reset
    </Button>
  </div>

  <div class="flex flex-row p-6 h-5/6">
    <div class="m-2 flex-1 bg-gray-800 rounded-xl p-4 text-center shadow-md hover:scale-103" style="background-color: #1a1a1a; box-shadow: 10px 10px 20px #000000, -5px -5px 10px rgba(255, 255, 255, 0.2);">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-gray-100 mb-4">
          {#if Object.keys(player1).length > 0}
            {player1.first_name} {player1.last_name}
          {:else}
            Player 1
          {/if}
        </h2>
        <div class="w-[12vw] h-[23vh]">
          <img
						class="object-cover w-full h-full"
            src={player1Image}
            alt="avatar 1"
          />
        </div>
				<ButtonGroup class="flex w-full flex-col">
					<Input
						class="mt-2 mb-4 rounded border-gray-300 text-black"
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
				{#if Object.keys(player1).length > 0}
					<div class="align-center mt-2 flex flex-col font-extrabold justify-center text-gray-300">
						<div class="flex items-center justify-center">
							{player1.height_in_cm} cm
						</div>
						<div class="flex items-center justify-center">
							{player1.weight_in_lbs} lbs
						</div>
						<div class="flex items-center justify-center">
							{player1.primary_position}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- STATS CONTAINER -->
    <div class="middle-sub-container flex justify-around align-start m-2 bg-gray-700 rounded-xl shadow-md p-4 hover:scale-103" style="background-color: #1a1a1a; box-shadow: 10px 10px 20px #000000, -5px -5px 10px rgba(255, 255, 255, 0.2);">
			<div class="font-medium">
        <p class="font-bold text-lg text-gray-100">Player 1</p>
				{#if Object.keys(player1Stats).length > 0}
					{#each Object.keys(player1Stats) as stat}
					<div class="mt-3 text-gray-300">
						{#if !(player1Stats[stat])}
							N/A
						{:else}
							{#if stat !== 'most_common_goal' && stat !== 'most_common_period'}
								{#if player1Stats[stat] > player2Stats[stat]}
									<p class="font-extrabold" style="text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);">{player1Stats[stat]}</p>
								{:else}
									{player1Stats[stat]}
								{/if}
							{:else}
								{player1Stats[stat]}
							{/if}
						{/if}
					</div>
					{/each}
				{/if}
			</div>
      <div class="stat-info text-center">
				<p class="font-bold text-lg text-gray-100">Stat info</p>
				{#if isLoading}
				<div class="flex justify-center items-center h-full">
					<Spinner color="gray" class="h-12 w-12" />
					</div>
				{/if}
				{#if Object.keys(player1Stats).length > 0 || Object.keys(player2Stats).length > 0}
					{#each Object.keys(player1Stats) as stat, index}
					<div class="mt-3 text-gray-300">
						{statMapping[stat] ?? stat}
						</div>
					{/each}
				{/if}
			</div>
      <div class="font-medium">
        <p class="font-bold text-lg text-gray-100">Player 2</p>
				{#if Object.keys(player2Stats).length > 0}
					{#each Object.keys(player2Stats) as stat}
					<div class="mt-3 text-gray-300 text-right">
						{#if !(player2Stats[stat])}
							N/A
						{:else}
							{#if stat !== 'most_common_goal' && stat !== 'most_common_period'}
								{#if player2Stats[stat] > player1Stats[stat]}
									<p class="font-extrabold" style="text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);">{player2Stats[stat]}</p>
								{:else}
									{player2Stats[stat]}
								{/if}
							{:else}
								{player2Stats[stat]}
							{/if}
						{/if}
					</div>
					{/each}
				{/if}
			</div>
		</div>

		<!-- PLAYER 2 CONTAINER -->
    <div class="flex-1 m-2 bg-gray-800 rounded-xl shadow-md p-4 text-center hover:scale-103" style="background-color: #1a1a1a; box-shadow: 10px 10px 20px #000000, -5px -5px 10px rgba(255, 255, 255, 0.2);">
			<div class="text-center">
				<h2 class="text-2xl text-gray-100 font-bold mb-4">
					{#if Object.keys(player2).length > 0}
						{player2.first_name} {player2.last_name}
					{:else}
						Player 2
					{/if}
				</h2>
				<div class="w-[12vw] h-[23vh]">
					<img
						class="object-cover w-full h-full"
						src={player2Image}
						alt="avatar 2"
					/>
				</div>
				<ButtonGroup class="flex w-full flex-col">
					<Input
						class="mt-2 mb-4 rounded border-gray-300 text-black"
						placeholder="Find Player"
						bind:value={player2Input}
						on:input={() => handlePlayerLookup(player2Input, 2)}
					/>
					<Dropdown>
						{#if player2List.length > 0}
							{#each player2List as player}
								<DropdownItem value={player.id} on:click={() => handlePlayerSelect(player, 2)}
									>{player.first_name} {player.last_name}</DropdownItem
								>
							{/each}
						{/if}
					</Dropdown>
				</ButtonGroup>
				{#if Object.keys(player2).length > 0}
					<div class="align-center mt-2 flex flex-col justify-center font-extrabold text-gray-300">
						<div class="flex items-center justify-center">
							{player2.height_in_cm} cm
						</div>
						<div class="flex items-center justify-center">
							{player2.weight_in_lbs} lbs
						</div>
						<div class="flex items-center justify-center">
							{player2.primary_position}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- BUTTON -->
	<div class="text-center">
    <Button class="bg-red-500 hover:bg-red-800 text-white font-bold py-2 px-4 rounded shadow-lg" on:click={handleSendQuery}>
      Compare
    </Button>
    {#if invalidChoice}
      <p class="text-red-500 mt-2">{invalidChoice}</p>
    {/if}
  </div>
</div>

<style>
	*	{
		flex-shrink: 0;
	}

	.middle-sub-container {
		flex: 3 1 0%;
	}

</style>
