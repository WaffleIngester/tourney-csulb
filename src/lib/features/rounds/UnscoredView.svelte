<script lang="ts">
    import type { RoundPlayer } from "./round-types.ts";

    const { roundId, players }: { roundId: number; players: RoundPlayer[] } =
        $props();
</script>

<section class="unscored-panel">
    <h1>Round {roundId + 1} data</h1>
    <div class="players-table">
        <table>
            <thead>
                <tr>
                    <th>pID</th>
                    <th>Player Name</th>
                    <th>PlayFab</th>
                    <th>Squad ID</th>
                    <th>Team ID</th>
                    <th>Kills</th>
                    <th>Placement</th>
                </tr>
            </thead>
            <tbody>
                {#each players as player (player.pID)}
                    <tr class={(player.pID - 1) % 2 === 0 ? "row-even" : "row-odd"}>
                        <td>
                            {player.pID}
                        </td>
                        <td>
                            {player.player}
                        </td>
                        <td>
                            {player.playfabID}
                        </td>
                        <td>
                            {player.squadID}
                        </td>
                        <td>
                            {player.teamID}
                        </td>
                        <td>
                            {player.kills}
                        </td>
                        <td>
                            {player.placement}
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    </div>
</section>
