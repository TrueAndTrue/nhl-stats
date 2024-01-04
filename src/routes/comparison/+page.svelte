<script lang="ts">
	import { Input, Button, Dropdown, DropdownItem, ButtonGroup, Spinner } from 'flowbite-svelte';
	import avatarEmpty from '$lib/images/avatar-empty.png';
	let apiBaseUrl = "" as any;
	const ENV = import.meta.env.VITE_NODE_ENV;
	ENV == 'dev' ? apiBaseUrl = "http://127.0.0.1:8000" : apiBaseUrl = import.meta.env.VITE_NHL_API_BASE_URL;
	const apiFindPlayersByName = import.meta.env.VITE_NHL_API_FIND_PLAYERS_BY_NAME_URL;
	const apiPlayerComparison = import.meta.env.VITE_NHL_API_PLAYER_COMPARISON_URL;

	let playerTypes = 0;    // 1 = skater, 2 = goalie

	let invalidChoice = true;
	let player1 = {} as any;
	let player1Input = "";
	let player1List = [] as any[];
	let player1Image = avatarEmpty;

	let player2 = {} as any;
	let player2Input = "";
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
			throw new Error("Invalid player number");
		}
	}

	const handlePlayerSelect = (player: any, playerNum: number) => {
		if (player.primary_position == "G" && playerTypes == 1) {
			invalidChoice = true;
			return;
		}
		else if (player.primary_position != "G" && playerTypes == 2) {
			invalidChoice = true;
			return;
		}
		else {
			invalidChoice = false;
		}
		player.primary_position == "G" ? playerTypes = 2 : playerTypes = 1;
		if (playerNum === 1) {
			player1 = player;
			player1Input = "";
			player1List = [];
			player1Image = player.headshot;
			if (player1.primary_position == "R" || player1.primary_position == "L") {
				player1.primary_position += "W";
			}
		} else if (playerNum === 2) {
			player2 = player;
			player2Input = "";
			player2List = [];
			player2Image = player.headshot;
			if (player2.primary_position == "R" || player2.primary_position == "L") {
				player2.primary_position += "W";
			}
		} else {
			throw new Error("Invalid player number");
		}
	}

	const statMapping: Record<string, string> = {
		"blocked_shots": "Blocked Shots",
		"missed_shots": "Missed Shots",
		"shots": "Shots",
		"penalties": "Penalties",
		"penalties_drawn": "Penalties Drawn",
		"hits": "Hits",
		"hittees": "Been Hit",
		"faceoff_wins": "Faceoff Wins",
		"faceoff_losses": "Faceoff Losses",
		"giveaways": "Giveaways",
		"goal_count": "Goals",
		"most_common_period": "Best Scoring Period",
		"most_common_shot_type": "Most Common Goal",
	}

	const handleSendQuery = async () => {
		player1Stats = {};
		player2Stats = {};
		if (player1 && player2) {
			isLoading = true;
			const response = await fetch(`${apiBaseUrl}${apiPlayerComparison}?player1=${player1.nhl_api_id}&player2=${player2.nhl_api_id}`);
			const data = await response.json();
			isLoading = false;
			player1Stats = data.player1;
			player2Stats = data.player2;
		}
	}
</script>

<svelte:head>
	<title>About</title>
	<meta name="description" content="About this app" />
</svelte:head>

<div class="container">
	<div class="flex justify-center">
		<h1 class="text-3xl font-semibold text-gray-800 mt-4">Player Comparison Tool</h1>
	</div>
	<div class="sub-container">
		<div class="left-sub-container">
			<div class="text-center">
				<h2 class="text-xl font-semibold mb-4">{#if Object.keys(player1).length > 0}
					{player1.first_name} {player1.last_name}
				{:else}
					Player 1
				{/if}</h2>
				<img class="border-2 border-black bg-white rounded-lg mb-4" src={player1Image} alt="avatar 1" />
				<ButtonGroup class="w-full flex flex-col">
					<Input class="mt-2" placeholder="Find Player" bind:value={player1Input} on:input={() => handlePlayerLookup(player1Input, 1)} />
					<Dropdown>
						{#if player1List.length > 0}
							{#each player1List as player}
								<DropdownItem value={player.id} on:click={() => handlePlayerSelect(player, 1)}>{player.first_name} {player.last_name}</DropdownItem>
							{/each}
						{/if}
					</Dropdown>
				</ButtonGroup>
				{#if Object.keys(player1).length > 0}
					<div class="flex flex-col align-center justify-center mt-4">
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
		<div class="middle-sub-container font-bold">
			<div class="player1-info font-medium">
				<p class="font-bold">Player 1</p>
				{#if Object.keys(player1Stats).length > 0}
				{#each Object.keys(player1Stats) as stat}
				<div class="mt-4">
					{player1Stats[stat] ?? "N/A"}
				</div>
				{/each}
				{/if}
			</div>
			<div class="stat-info text-center">
				Stat info
				{#if isLoading}
					<div class="flex justify-center items-center mt-40">
						<Spinner color="gray" class="w-12 h-12" />
					</div>
				{/if}
				{#if Object.keys(player1Stats).length > 0 || Object.keys(player2Stats).length > 0}
					{#each Object.keys(player1Stats) as stat}
						<div class="mt-4">
							{statMapping[stat] ?? stat}
						</div>
					{/each}
				{/if}
			</div>
			<div class="player2-info font-medium">
				<p class="font-bold">Player 2</p>
				{#if Object.keys(player2Stats).length > 0}
					{#each Object.keys(player2Stats) as stat}
						<div class="mt-4">
							{player2Stats[stat] ?? "N/A"}
						</div>
					{/each}
				{/if}
			</div>
		</div>
		<div class="right-sub-container">
			<div class="text-center">
				<h2 class="text-xl font-semibold mb-4">{#if Object.keys(player2).length > 0}
					{player2.first_name} {player2.last_name}
				{:else}
					Player 2
				{/if}</h2>
					<img class="border-2 border-black bg-white rounded-lg mb-4" src={player2Image} alt="avatar 2">
					<ButtonGroup class="w-full flex flex-col">
						<Input class="mt-2" placeholder="Find Player" bind:value={player2Input} on:input={() => handlePlayerLookup(player2Input, 2)} />
						<Dropdown>
							{#if player2List.length > 0}
								{#each player2List as player}
									<DropdownItem value={player.id} on:click={() => handlePlayerSelect(player, 2)}>{player.first_name} {player.last_name}</DropdownItem>
								{/each}
							{/if}
						</Dropdown>
					</ButtonGroup>
				{#if Object.keys(player2).length > 0}
					<div class="flex flex-col align-center justify-center mt-4">
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
	<div>
		<div class="middle-sub-container2">
			<div class="flex flex-col justify-center align-center max-w-24 w-1/7">
				<Button class="bg-red-500 text-white max-w-18 box-border" on:click={() => handleSendQuery()}>
					Compare
				</Button>
				{#if invalidChoice}
					<p class="text-red-500 font-bold whitespace-nowrap mr-6">Cannot compare a goalie to a skater</p>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	/* Container Styles */
  .container {
    display: flex;
    flex-direction: column;
    background-color: #F3F4F6;
    height: 83vh;
    width: 100%;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.3s ease-in-out;
  }

  .container:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
  }

  /* Sub-container Styles */
  .sub-container {
    display: flex;
    flex-direction: row;
    padding: 1.5rem;
  }

  .left-sub-container,
  .middle-sub-container,
  .right-sub-container {
    flex: 1;
    background-color: #E2E8F0; /* Light Grayish Blue */
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    margin: 0.5rem;
		padding: 1rem;
  }

  .middle-sub-container {
    display: flex;
    justify-content: space-around;
    align-items: flex-start;
    flex: 2;
  }

  .middle-sub-container2 {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    flex: 2;
  }

  /* Text and Border Styles */
  .text-center {
    text-align: center;
  }

  .border-black {
    border-color: #1F2937;
  }

  .rounded-lg {
    border-radius: 12px;
  }

  /* Button Styles */
  .bg-red-500 {
    background-color: #EF4444; /* Red */
  }

  .text-white {
    color: #FFFFFF;
  }

  /* Input and Dropdown Styles */
  .bg-white {
    background-color: #FFFFFF;
  }

  /* Additional Styles (Adjust as Needed) */
  .mb-4 {
    margin-bottom: 1rem;
  }

  .mt-2 {
    margin-top: 0.5rem;
  }

  .w-full {
    width: 100%;
  }

  .flex-col {
    flex-direction: column;
  }

  .flex {
    display: flex;
  }

  .justify-center {
    justify-content: center;
  }

  .items-center {
    align-items: center;
  }

  .font-semibold {
    font-weight: 600;
  }

  .text-gray-800 {
    color: #1F2937;
  }

  .text-xl {
    font-size: 1.25rem;
  }
</style>
