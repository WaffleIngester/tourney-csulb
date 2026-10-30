<script lang="ts">
    import { ScoredTeam } from "#lib/features/scoring/scored-team.ts";

    const { roundId, squads }: { roundId: number; squads: ScoredTeam[] } =
        $props();
</script>

<section class="scored-panel">
    <h1>Round {roundId} scores</h1>
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
                    <th>Place</th>
                    <th>Points</th>
                    <th>Team Pts</th>
                </tr>
            </thead>
            <tbody>
                {#each squads as squad, k (squad.localId)}
                    {#each squad.teamMembers as player, i (player.playfabID)}
                        <tr class:row-even={k % 2 === 0}
                            class:row-odd={k % 2 !== 0}
                            class:ghost={squad.localId === -1}>
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
                                {squad.placement}
                            </td>
                            <td>
                                {player.points}
                            </td>
                            {#if i === 0}
                                <td class="team-points"
                                    class:row-even={k % 2 === 0}
                                    class:row-odd={k % 2  !== 0}
                                    class:ghost={squad.localId === -1}
                                    rowspan={squad.teamMembers.length} >
                                    {squad.teamPoints}
                                </td>
                            {/if}
                        </tr>
                    {/each}
                {/each}
            </tbody>
        </table>
    </div>
</section>
