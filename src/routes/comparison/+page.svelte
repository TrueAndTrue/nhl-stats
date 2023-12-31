<script lang="ts">
	import { Input, ButtonGroup, Button, Dropdown, DropdownItem, P } from 'flowbite-svelte';
	import avatarEmpty from '$lib/images/avatar-empty.png';
	import { stringify } from 'postcss';
	
	let player1 = {} as any;
	let player1Input = "";
	let player1List = [] as any[];
	let player1Image = avatarEmpty;

	let player2 = {} as any;
	let player2Input = "";
	let player2List = [] as any[];
	let player2Image = avatarEmpty;

	let player1Stats = {}	as any;
	let player2Stats = {} as any;

	const handlePlayerLookup = async (name: string, playerNum: number) => {
		if (playerNum === 1) {
			const response = await fetch(`http://127.0.0.1:8000/players/find-players-by-name/?name=${name}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include'
			});
			console.log(response);
			const data = await response.json();
			console.log(data);
			player1List = data.players.slice(0, 5);
			console.log(player1List);
		} 
		else if (playerNum === 2) {
			const response = await fetch(`http://127.0.0.1:8000/players/find-players-by-name/?name=${name}`);
			console.log(response);
			const data = await response.json();
			console.log(data);
			player2List = data.players.slice(0, 5);
			console.log(player2List);
		} 
		else {
			throw new Error("Invalid player number");
		}
	}	

	const handlePlayerSelect = (player: any, playerNum: number) => {
		if (playerNum === 1) {
			player1 = player;
			player1Input = "";
			player1List = [];
			player1Image = player.headshot;
		} 
		else if (playerNum === 2) {
			player2 = player;
			player2Input = "";
			player2List = [];
			player2Image = player.headshot;
		} 
		else {
			throw new Error("Invalid player number");
		}
	}

	const statMapping: Record<string, string> = {
		"blocked_shots": "Blocked Shots",
		"missed_shots": "Missed Shots",
		"shots": "Shots",
		"penalties"	: "Penalties",
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
		if (player1 && player2) {
			console.log(`http://127.0.0.1:8000/players/player-comparison?player1=${player1.nhl_api_id}&player2=${player2.nhl_api_id}`)
			const response = await fetch(`http://127.0.0.1:8000/players/player-comparison?player1=${player1.nhl_api_id}&player2=${player2.nhl_api_id}`);
			const data = await response.json();
			console.log(data);
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
		<h1>Player Comparison Tool</h1>
	</div>
	<div class="sub-container">
		<div class="left-sub-container">
			<div class="">
				<h2 class="text-center">{#if Object.keys(player1).length > 0}
					{player1.first_name} {player1.last_name}
				{:else}
					Player 1
				{/if}
				</h2>
				<img class="border-2 border-black bg-white rounded-lg" src={player1Image} alt="avatar 1" />
				<div>
					<ButtonGroup class="w-full flex flex-col">
						<Input class="mt-2" placeholder="Find Player" bind:value={player1Input} on:input={() => handlePlayerLookup(player1Input, 1)}/>
						<Dropdown>
							{#if player1List.length > 0}
								{#each player1List as player}
									<DropdownItem value={player.id} on:click={() => handlePlayerSelect(player, 1)}>{player.first_name} {player.last_name}</DropdownItem>
								{/each}
							{/if}
						</Dropdown>
					</ButtonGroup>
					{#if Object.keys(player1).length > 0}
						<div class="flex flex-col align-center justify-center">
							<div class="flex align-center justify-center">
								{player1.height_in_cm} cm
							</div>
							<div class="flex align-center justify-center">
								{player1.weight_in_lbs} lbs
							</div>
							<div class="flex align-center justify-center">
								{player1.primary_position}
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
		<div class="middle-sub-container">
			<div class="player1-info">
				Player 1
				{#if Object.keys(player1Stats).length > 0}
					{#each Object.keys(player1Stats) as stat}
						<div class="mt-4">
							{player1Stats[stat] ?? "N/A"}
						</div>
					{/each}
				{/if}
			</div>
			<div class="stat-info">
				Stat info
				{#if Object.keys(player1Stats).length > 0 || Object.keys(player2Stats).length > 0}
					{#each Object.keys(player1Stats) as stat}
						<div class="mt-4">
							{statMapping[stat] ?? stat}
						</div>
					{/each}
				{/if}
			</div>
			<div class="player2-info">
				Player 2
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
			<div>
				<h2 class="text-center">{#if Object.keys(player2).length > 0}
					{player2.first_name} {player2.last_name}
				{:else}
					Player 2
				{/if}</h2>
				<img class="border-2 border-black bg-white rounded-lg" src={player2Image} alt="avatar 2">
				<ButtonGroup class="w-full flex flex-col">
					<Input class="mt-2" placeholder="Find Player" bind:value={player2Input} on:input={() => handlePlayerLookup(player2Input, 2)}/>
					<Dropdown>
						{#if player2List.length > 0}
							{#each player2List as player}
								<DropdownItem value={player.id} on:click={() => handlePlayerSelect(player, 2)}>{player.first_name} {player.last_name}</DropdownItem>
							{/each}
						{/if}
					</Dropdown>
				</ButtonGroup>
				{#if Object.keys(player2).length > 0}
						<div class="flex flex-col align-center justify-center">
							<div class="flex align-center justify-center">
								{player2.height_in_cm} cm
							</div>
							<div class="flex align-center justify-center">
								{player2.weight_in_lbs} lbs
							</div>
							<div class="flex align-center justify-center">
								{player2.primary_position}
							</div>
						</div>
					{/if}
			</div>
		</div>
	</div>
	<div>
		<div class="middle-sub-container2">
			<div>
				<Button color="red" on:click={() => handleSendQuery()}>
					Send query
				</Button>
			</div>
		</div>
	</div>
</div>

<style>

	@import 'tailwindcss/base';
  @import 'tailwindcss/components';
  @import 'tailwindcss/utilities';
	
	.container {
		display: flex;
		flex-direction: column;
		background-color: bisque;
		height: 75vh;
		width: 100%;
		border-radius: 10px;
	}

	.sub-container {
		display: flex;
		flex-direction: row;
		padding: 1.5rem;
	}

	.player1-info {
		display: flex;
		height: 100%;
		flex-direction: column;
		justify-content: flex-start;
		flex: 1;
		text-align: center;
	}

	.player2-info {
		display: flex;
		height: 100%;
		flex-direction: column;
		justify-content: flex-start;
		flex: 1;
		text-align: center;
	}

	.stat-info {
		display: flex;
		height: 100%;
		flex-direction: column;
		justify-content: flex-start;
		flex: 1;
		text-align: center;
	}

	.left-sub-container {
		flex: 1;
		background-color: bisque;
	}

	.middle-sub-container {
		display: flex;
		justify-content: space-around;
		align-items: flex-start;
		flex: 2;
		background-color: bisque;
	}

	.middle-sub-container2 {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		align-items: center;
		flex: 2;
		background-color: bisque;
	}

	.right-sub-container {
		display: flex;
		flex: 1;
		justify-content: flex-end;
		background-color: bisque;
	}
</style>