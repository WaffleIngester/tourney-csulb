<script lang="ts">
  import type { Round } from "#lib/features/rounds/round-types.ts";
  import type { Config, PointRange } from "./config-types";
  import hoverIcon from "../../assets/hover-icon.svg";

  type Props = {
    configs: Config[];
    activeRound: Round | null;
    onAddConfig: () => void;
    onSelectConfig: (configId: number) => void;
    onDeleteConfig: (configId: number) => void;
    onUpdateConfig: (config: Config) => void;
  };

  let {
    configs,
    activeRound,
    onAddConfig,
    onSelectConfig,
    onDeleteConfig,
    onUpdateConfig
  }: Props = $props();

  let currentConfig = $derived(
    configs.find((config) => config.id === activeRound?.configID) ??
      configs[0] ??
      null
  );

  let configErrors = $derived.by(() => {
    if (!currentConfig) return [];

    const errors = new Set<string>();
    const ranges = currentConfig.pointRanges;

    if (
        currentConfig.pointsPerKill < 0 ||
        currentConfig.pointsKillLeader < 0 ||
        ranges.some((range) => range.points < 0)
    ) {
        errors.add("Points too low!");
    }

    if (currentConfig.killCap < 0) {
        errors.add("Kill cap cannot be negative!");
    }

    ranges.forEach((range, index) => {
        const firstPlace = index === 0 ? 1 : ranges[index - 1].maxPlace + 1;

        if (range.maxPlace > 64) {
        errors.add("Placement # too high! (1-64)");
        } else if (range.maxPlace < firstPlace) {
        errors.add("Placement ranges must be in order.");
        }

        if (!Number.isInteger(range.maxPlace)) {
        errors.add("Placements must be whole numbers.");
        }
    });

    return [...errors];
});

  let configWarningDialog = $state<HTMLDialogElement | null>(null);

  function changeActiveConfig(configId: number): void {
    onSelectConfig(configId);
  }

  function callbackProcessConfigDeleted(configId: number): void {
    // essentially: main app iterate through all rounds
    // find which round has the provided config id.
    // set it to the first index (or previous. TBD), and then actually remove...
    // ...the configuration at this index. actually... pretty much all other...
    // ...rounds need to have their index shifted over, most likely, as they may be now...
    // ...referencing configs which are no longer existent at those indices due to the...
    // ...list being resized. DAMN IT.
    // anyways, if this is the last configuration, we tell the user that they cannot delete it.
    // we do no more work after that. we just open a modal for them to acknowledge and then move on.
    if (configs.length <= 1) {
        configWarningDialog?.showModal();
        return;
    }

    onDeleteConfig(configId);
  }

  function updateNumber(
    field: "pointsPerKill" | "killCap" | "pointsKillLeader",
    value: string
  ): void {
    if (!currentConfig || value.trim() === "") return;

    const number = Number(value);
    if (!Number.isFinite(number)) return;

    onUpdateConfig({ ...currentConfig, [field]: number });
  }

    function normalizePointRanges(ranges: PointRange[]): PointRange[] {
        const ordered = [...ranges].sort((a, b) => a.maxPlace - b.maxPlace);
        const normalized: PointRange[] = [];

        for (const range of ordered) {
            const previous = normalized[normalized.length - 1];

            if (previous && previous.points === range.points) {
                previous.maxPlace = range.maxPlace;
            } else {
                normalized.push({ ...range });
            }
        }
        return normalized;
    }

  function updateRange(
    index: number,
    field: keyof PointRange,
    value: string
  ): void {
    if (!currentConfig || value.trim() === "") return;

    const number = Number(value);
    if (!Number.isFinite(number)) return;

    const pointRanges = normalizePointRanges(
        currentConfig.pointRanges.map((range, rangeIndex) =>
            rangeIndex === index ? { ...range, [field]: number } : range
        )
    );

    onUpdateConfig({ ...currentConfig, pointRanges });
  }

  function callbackAddNewRange(): void {
    if (!currentConfig) return;

    const ranges = currentConfig.pointRanges;

    if (ranges.length === 0) {
      onUpdateConfig({
        ...currentConfig,
        pointRanges: [{ maxPlace: 64, points: 0 }]
      });
      return;
    }

    let widestIndex = -1;
    let widestStart = 1;
    let widestWidth = 1;

    for (let index = 0; index < ranges.length; index += 1) {
      const start = index === 0 ? 1 : ranges[index - 1].maxPlace + 1;
      const width = ranges[index].maxPlace - start + 1;

      if (width > widestWidth) {
        widestIndex = index;
        widestStart = start;
        widestWidth = width;
      }
    }

    if (widestIndex === -1) return;

    // split the widest range while keeping its current point value.
    const existingRange = ranges[widestIndex];
    const splitAt = widestStart + Math.floor(widestWidth / 2) - 1;
    const pointRanges = [...ranges];

    pointRanges[widestIndex] = { ...existingRange, maxPlace: splitAt };
    pointRanges.splice(widestIndex + 1, 0, {
      maxPlace: existingRange.maxPlace,
      points: existingRange.points
    });

    onUpdateConfig({ ...currentConfig, pointRanges });
  }

  function removeRange(index: number): void {
    if (!currentConfig || currentConfig.pointRanges.length <= 1) return;

    const pointRanges = normalizePointRanges(
        currentConfig.pointRanges.filter(
        (_, rangeIndex) => rangeIndex !== index
    )
);

    onUpdateConfig({ ...currentConfig, pointRanges });
    }
</script>

<section class="config-panel">
  <div class="config-selector">
    <button class="add-entry" type="button" onclick={onAddConfig}>
      New Config
    </button>

    <ul class="config-options">
      {#each configs as config (config.id)}
        <li>
          <button
            class="item-entry"
            class:selected={activeRound?.configID === config.id}
            aria-pressed={activeRound?.configID === config.id}
            type="button"
            onclick={() => changeActiveConfig(config.id)}
          >
            Config {config.id + 1}
          </button>

          <button
            class="item-delete"
            type="button"
            aria-label={`Delete Config ${config.id + 1}`}
            onclick={() => callbackProcessConfigDeleted(config.id)}
          >
            ×
          </button>
        </li>
      {/each}
    </ul>
  </div>

  <div class="config-primary-settings">
    {#if currentConfig}
      <div class="config-settings">
        <h1>General settings</h1>

        <ul class="config-general">
          <li>
            <span>
              <h2>Points Per Kill</h2>
              <img
                class="help-icon"
                src={hoverIcon}
                alt=""
                title="Each kill adds this many points."
              />
            </span>
            <input
              type="number"
              min="0"
              value={currentConfig.pointsPerKill}
              oninput={(event) =>
                updateNumber("pointsPerKill", event.currentTarget.value)}
            />
          </li>

          <li>
            <span>
              <h2>Kill cap</h2>
              <img
                class="help-icon"
                src={hoverIcon}
                alt=""
                title="Most kills that can score per team in one round. Use 0 for no cap."
              />
            </span>
            <input
              type="number"
              min="0"
              value={currentConfig.killCap}
              oninput={(event) =>
                updateNumber("killCap", event.currentTarget.value)}
            />
          </li>

          <li>
            <span>
              <h2>Kill leader points</h2>
              <img
                class="help-icon"
                src={hoverIcon}
                alt=""
                title="Points to award to players who have the most kills in the round."
              />
            </span>
            <input
              type="number"
              min="0"
              value={currentConfig.pointsKillLeader}
              oninput={(event) =>
                updateNumber("pointsKillLeader", event.currentTarget.value)}
            />
          </li>
        </ul>
      </div>

      <div class="config-placements">
        <div class="config-settings">
          <h1>Points per placement</h1>

          <ul class="config-placement-ranges">
            {#each currentConfig.pointRanges as range, index (index)}
              {@const firstPlace =
                index === 0
                  ? 1
                  : currentConfig.pointRanges[index - 1].maxPlace + 1}
              {@const nextRangeStart =
                currentConfig.pointRanges[index + 1]?.maxPlace ?? 65}

              <li>
                <span>Places</span>
                <input
                  type="number"
                  value={firstPlace}
                  aria-label={`Starting place for range ${index + 1}`}
                  readonly
                />
                <span>to</span>
                <input
                  type="number"
                  min={firstPlace}
                  max={nextRangeStart - 1}
                  value={range.maxPlace}
                  aria-label={`Ending place for range ${index + 1}`}
                  oninput={(event) =>
                    updateRange(index, "maxPlace", event.currentTarget.value)}
                />
                <span>:</span>
                <input
                  type="number"
                  min="0"
                  value={range.points}
                  aria-label={`Points for range ${index + 1}`}
                  oninput={(event) =>
                    updateRange(index, "points", event.currentTarget.value)}
                />
                <span>pts</span>
                <button
                  type="button"
                  disabled={currentConfig.pointRanges.length <= 1}
                  aria-label={`Remove range ending at place ${range.maxPlace}`}
                  onclick={() => removeRange(index)}
                >
                  Remove
                </button>
              </li>
            {/each}
          </ul>

          <button
            class="add-entry"
            type="button"
            onclick={callbackAddNewRange}
          >
           Add range
          </button>
          {#if configErrors.length > 0}
            <ul class="config-errors" aria-live="polite">
              {#each configErrors as error (error)}
                <li>{error}</li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>
    {:else}
      <p>Create a config to edit its scoring rules.</p>
    {/if}
  </div>
</section>

<dialog class="reset-dialog" bind:this={configWarningDialog}>
  <div class="reset-dialog-content">
    <h2>Config required</h2>
    <p>You must keep at least one config.</p>
    <div class="reset-dialog-actions">
      <button
        class="button go-back-button"
        type="button"
        onclick={() => configWarningDialog?.close()}
      >
        OK
      </button>
    </div>
  </div>
</dialog>