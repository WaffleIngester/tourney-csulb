<script lang="ts">
    import type { Round } from "#lib/features/rounds/round-types.ts";
    import type { Config } from "./config-types";
    
    const configs: Config[] = [];
    const round: Round = {id: 0, label: "0", configID: 0, players: []};
    
    let currentConfig: Config = { id: 0, pointsPerKill: 1, pointsKillLeader: 0, killCap: 0, pointRanges: [{maxPlace: 5, points: 5}]};

    function changeActiveConfig(configId: number, round: Round): void {
        round.configID = configId;
    }

    function callbackProcessConfigDeleted(configId: number): void {
        // essentially: main app iterate through all rounds
        // find which round has the provided config id.
        // set it to the first index (or previous. TBD), and then actually remove...
        // ...the configuration at this index. actually... pretty much all other...
        // ...rounds need to have their index shifted over, most likely, as they may be now...
        // ... referncing configs which are no longer existent at those indicies due to the...
        // ... list being resized. DAMN IT.
        // anyways, if this is the last configuration, we tell the user that they cannot delete it.
        // we do no more work after that. we just open a modal for them to acknowledge and then move on.
        console.error("processDeletedConfig: not implemented.");
    }

    function callbackAddNewRange(): void {
        console.error("callbackAddNewRange: not implemented.")
    }

</script>

<section class="config-panel">
    <div class="config-selector">
        <buttton class="add-entry">
            New Config
        </buttton>
        <ul class="config-options">
            {#each configs as config (config.id)}
            <li>
                <button class="item-entry"
                    onclick={() => changeActiveConfig(config.id, round)}>Config {config.id}</button>
                <button class="item-delete"
                    onclick={() => callbackProcessConfigDeleted(config.id)}>X</button>
            </li>
            {/each}
        </ul>
    </div>
    <div class="config-primary-settings">
        <div class="config-settings">
            <h1>General settings</h1>
            <ul class="config-general">
                <li>
                    <span><h2>Points Per Kill</h2><svg title="Amount of points that should be awarded per kill"></svg></span>
                    <input type="number">
                </li>
                <li>
                    <span><h2>Kill cap</h2><svg title="Maximum number of kills achievable by a single player."></svg></span>
                    <input type="number">
                </li>
                <li>
                    <span><h2>Kill leader points</h2><svg title="Points to reward to the kill leader. 0 means no points."></svg></span>
                    <input type="number">
                </li>
            </ul>
        </div>
        <div class="config-placements">
        <div class="config-settings">
            <h1>Points per placement</h1>
            <ul class="config-placement-ranges">
                {#each currentConfig.pointRanges as ranges}
                {/each}
            </ul>
            <button class=add-entry onclick={() => callbackAddNewRange}>Add range</button>
            <p>ERROR: Errors go here?</p>
        </div>
        </div>
    </div>
</section>