<script lang="ts">
  // --- TODO ---

  // MAIN CONCERN: ** --> Fix RoundIndex <-- **
  // MAIN PROGRESS: Fix CSS/ Modularlize components.

  // css
  import "./page.css";

  // round imports
  import type { Round } from "#lib/features/rounds/round-types.ts";
  import { TsvToRoundPlayers } from "#lib/features/rounds/round-actions.ts";

  // tsv imports
  import { TextToTSV } from "#lib/utils/tsv-reader.ts";
  import type { TsvRow } from "#lib/utils/tsv-reader.ts";
  import { ColumnType, getTsvError } from "#lib/utils/tsv-validator.ts";
  import type { RequiredColumn } from "#lib/utils/tsv-validator.ts";

  // gamemode
  import { Gamemode } from "#lib/utils/gamemode.ts";
  import { getMaxTeamSizeForGamemode } from "#lib/utils/gamemode.ts";

  // scored imports
  import type { Config } from "#lib/features/configs/config-types.ts";
  import { ScoredTeam } from "#lib/features/scoring/scored-team.ts";
  import { calculateScores } from "#lib/features/scoring/scoring-actions.ts";

  // views
  import UnscoredView from "#lib/features/rounds/UnscoredView.svelte";
  import ScoredView from "#lib/features/rounds/ScoredView.svelte";

  // columns required when validating an imported tsv.
  // there are no aliases. you're either right, or you're wrong.
  const requiredColumns: RequiredColumn[] = [
    { name: "pID", type: ColumnType.Integer },
    { name: "Player", type: ColumnType.String },
    { name: "PlayfabID", type: ColumnType.String },
    { name: "SquadID", type: ColumnType.Integer },
    { name: "TeamID", type: ColumnType.Integer },
    { name: "Kills", type: ColumnType.Integer },
    { name: "Placement", type: ColumnType.Integer }
  ];

  // currently-active view being used rn!!
  type ActiveView = "scored" | "unscored" | "import" | "config" | "leaderboard";

  const viewOptions = [
    { id: "scored", label: "View Scored", requiresPlayers: true },
    { id: "unscored", label: "View Unscored", requiresPlayers: true },
    { id: "import", label: "Replace Data", requiresPlayers: false },
    { id: "config", label: "Edit Scoring Rules", requiresPlayers: false }
  ] as const;

  type LeaderboardPlayer = {
    rank: number;
    playfabID: string;
    name: string;
    roundScores: (number | null)[];
    total: number;
  };

  let leaderboard = $derived.by(() => {
    const playersById = new Map<string, Omit<LeaderboardPlayer, "rank">>();

    rounds.forEach((round, roundIndex) => {
      if (round.players.length === 0) return;

      const squads = getScoredTeamsForRound(roundIndex);

      for (const squad of squads) {
        const placementShare =
          squad.size > 0 ? squad.placementPoints / squad.size : 0;

        for (const player of squad.teamMembers) {
          let entry = playersById.get(player.playfabID);

          if (!entry) {
            entry = {
              playfabID: player.playfabID,
              name: player.player,
              roundScores: Array(rounds.length).fill(null),
              total: 0
            };
            playersById.set(player.playfabID, entry);
          }

          const score = player.points + placementShare;
          entry.roundScores[roundIndex] = score;
          entry.total += score;
        }
      }
    });

    return [...playersById.values()]
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
      .map((player, index) => ({ ...player, rank: index + 1 }));
  });

  function exportLeaderboard() {
    const headers = [
      "Place",
      "Player",
      ...rounds.map((round) => round.label),
      "Total Points"
    ];

    const rows = leaderboard.map((player) => [
      player.rank,
      player.name,
      ...player.roundScores.map((score) => score ?? ""),
      player.total
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const text = String(value);
            const safeText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
            return `"${safeText.replaceAll('"', '""')}"`;
          })
          .join(",")
      )
      .join("\r\n");

    const file = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = "tournament-leaderboard.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  let gamemode = $state(Gamemode.Solos);
  let status = $state("");
  let pastedOutput = $state("");
  let pasteError = $state("");

  let resetDialog = $state<HTMLDialogElement | null>(null);
  let roundWarningDialog = $state<HTMLDialogElement | null>(null);
  let pasteDialog = $state<HTMLDialogElement | null>(null);
  let fileInput = $state<HTMLInputElement | null>(null);

  let rounds = $state<Round[]>([
  { id: 1, label: "Round 1", configID: 0, players: [] }
  ]);
  let configs = $state<Config[]>([{ id: "0", killCap: 0, pointsPerKill: 1, pointsKillLeader: 0, pointRanges: [{ maxPlace: 64, points: 1 }] }]);

  // round ids are unique and are separate from round array positions.
  // round ids are unique and are separate from round array positions.
  let activeRoundId = $state<number | null>(1);
  let nextRoundId = $state(2);
  let activeView = $state<ActiveView>("import");

  let activeRound = $derived(
    rounds.find((round) => round.id === activeRoundId) ?? null
  );

  let activeRoundIndex = $derived(
    rounds.findIndex((round) => round.id === activeRoundId)
  );

  // todo: popups when using invalid gamemode
  // todo: forces always active round. need more robust way to do this for ANY round and then return the  
  function getScoredTeamsForRound(roundIndex: number): ScoredTeam[] {
    if (roundIndex <= -1) {
      throw new Error("Tried to perform scoring but the given round index is negative. Why?");
    }

    const round: Round = rounds[roundIndex];
    if (round === undefined) {
      throw new Error(`Could not locate a Round at index: ${roundIndex}.`);
    }
    if (round.players.length === 0) {
      console.warn(`Attempted scoring on a round with no players at index ${roundIndex}.`);
      return [];
    }

    const config: Config = configs[round.configID];
    if (config === undefined) {
      throw new Error(`Could not locate the config for the active round. Search for config @ index ${round.configID}?`)
    }

    const maxTeamSize: number = getMaxTeamSizeForGamemode(gamemode);
    let squads: ScoredTeam[];
    try {
      squads = calculateScores(maxTeamSize, config, round.players);
    } catch {
      // todo: actually handle improper team sizes. for now, this works, I suppose.
      console.error("Tried scoring for a gamemode with team sizes smaller than those in the provided dataset.");
      console.error("Teams have been calculated as SQUADS to not throw an error. In the future, one should be clearly notified.");
      squads = calculateScores(4, config, round.players);
    }
    if (squads === null || squads === undefined) {
      console.error("ya don goofed.");
      return [];
    }

    // todo: should have more of a scoring-result which includes any fancy data facts we want.
    return squads;
  }

  let activeRoundHasPlayers = $derived(
    (activeRound?.players.length ?? 0) > 0
  );

  function selectRound(round: Round) {
    activeRoundId = round.id;
    activeView = round.players.length > 0 ? "scored" : "import";
    status = "";
  }

  function addRound() {
    const round: Round = {
      id: nextRoundId,
      label: `Round ${rounds.length + 1}`,
      configID: 0,
      players: []
    };

    rounds = [...rounds, round];
    activeRoundId = round.id;
    activeView = "import";
    nextRoundId += 1;
    status = "";
  }

  // the last round stays,, shift skips the delete confirmation.
  function removeRound(id: number, event: MouseEvent) {
    if (rounds.length <= 1) {
      status = "";
      roundWarningDialog?.showModal();
      return;
    }

    if (
      !event.shiftKey &&
      !window.confirm("Delete this round and its imported data?")
    ) {
      return;
    }

    const removedIndex = rounds.findIndex((round) => round.id === id);

    // keep ids stable and renumber the tabs that remain.
    const remainingRounds = rounds
      .filter((round) => round.id !== id)
      .map((round, index) => ({
        ...round,
        label: `Round ${index + 1}`
      }));

    if (activeRoundId === id) {
      const nextSelectedIndex = Math.min(
        removedIndex,
        remainingRounds.length - 1
      );
      activeRoundId = remainingRounds[nextSelectedIndex]?.id ?? null;
      activeView = "import";
    }

    rounds = remainingRounds;
    nextRoundId = Math.max(...remainingRounds.map((round) => round.id)) + 1;
    status = "";
  }

  function viewLeaderboard() {
    activeRoundId = null;
    activeView = "leaderboard";
    status = "";
  }

  function changeActiveView(view: ActiveView) {
    if ((view === "scored" || view === "unscored") && !activeRoundHasPlayers) {
      activeView = "import";
      status = "Import player data for this round first.";
      return;
    }

    activeView = view;
    status = "";
  }

  function openResetDialog() {
    resetDialog?.showModal();
  }

  function resetTournament() {
    gamemode = Gamemode.Solos;
    status = "";
    pastedOutput = "";
    pasteError = "";
    rounds = [{ id: 1, label: "Round 1", configID: 0, players: [] }];
    activeRoundId = 1;
    nextRoundId = 2;
    activeView = "import";

    if (fileInput) {
      fileInput.value = "";
    }

    resetDialog?.close();
  }

  function openPasteDialog() {
    pasteError = "";
    pasteDialog?.showModal();
  }

  function submitPaste(event: SubmitEvent) {
    event.preventDefault();
    pasteError = "";

    if (!activeRound) {
      pasteError = "Choose a round before importing player data.";
      return;
    }

    if (!pastedOutput.trim()) {
      pasteError = "Paste the /getplayers output first.";
      return;
    }

    let roundData: TsvRow[];

    try {
      roundData = TextToTSV(pastedOutput);
    } catch {
      pasteError = "The pasted data could not be read. Check the TSV format.";
      return;
    }

    const validationError = getTsvError(roundData, requiredColumns);

    if (validationError) {
      pasteError = validationError.message;
      return;
    }

    const players = TsvToRoundPlayers(roundData);

    rounds = rounds.map((round) =>
      round.id === activeRound.id ? { ...round, players } : round
    );

    pastedOutput = "";
    status = `Imported ${players.length} players into ${activeRound.label}.`;
    activeView = "scored";
    pasteDialog?.close();
  }

  // file selection reports the name,, parsing can be connected later.
  async function handleFileChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    try {
      pastedOutput = await file.text();
      pasteError = "";
      status = `Selected: ${file.name}`;
      pasteDialog?.showModal();
    } catch {
      status = `Could not read ${file.name}. Please choose a text file.`;
    }
  }
</script>

<svelte:head>
  <title>SAR Tourney Scorer</title>
</svelte:head>

<header class="topbar">
  <a class="brand" href="/">SAR Tourney Scorer</a>

  <div class="topbar-controls">
    <label class="gamemode-control">
      <span>Gamemode:</span>
      <select bind:value={gamemode} aria-label="Gamemode">
        {#each Object.entries(Gamemode) as [key, value]}
          <option value={value}>{key}</option>
        {/each}
      </select>
    </label>

    <button class="reset-button" type="button" onclick={openResetDialog}>
      Reset Tournament
    </button>
  </div>
</header>

<main class="page-shell">
  <nav class="round-navigation" aria-label="Tournament rounds">
    <button class="button add-round" type="button" onclick={addRound}>
      Add round
    </button>

    <div class="round-tabs" aria-label="Rounds">
      {#each rounds as round (round.id)}
        <div class="round-tab" class:active={activeRoundId === round.id}>
          <button
            class="round-select"
            type="button"
            aria-pressed={activeRoundId === round.id}
            onclick={() => selectRound(round)}
          >
            {round.label}
          </button>

          <button
            class="close-round"
            type="button"
            aria-label={`Remove ${round.label}. Hold Shift to skip confirmation.`}
            title="Hold Shift while clicking to skip confirmation"
            onclick={(event) => removeRound(round.id, event)}
          >
            ×
          </button>
        </div>
      {/each}
    </div>

    <button
      class="button leaderboard-button"
      class:active={activeView === "leaderboard"}
      type="button"
      onclick={viewLeaderboard}
    >
      Leaderboard
    </button>
  </nav>

  <div class="content-layout">
    <section class="main-panel" class:showing-import={activeView === "import"}>
      {#if activeView === "scored"}
        {#if activeRound}
          <ScoredView
            roundId={activeRound.id}
            squads={getScoredTeamsForRound(activeRoundIndex)}
          />
        {/if}
      {:else if activeView === "unscored"}
        {#if activeRound}
          <UnscoredView
            roundId={activeRound.id}
            players={activeRound.players}
          />
        {/if}
        {:else if activeView === "import"}
          <div class="import-content">
            <div class="drop-area">
              <div>
                <h1>Import the /getplayers file</h1>

                <input
                  bind:this={fileInput}
                  class="visually-hidden"
                  id="player-file"
                  type="file"
                  accept=".txt,.csv,.tsv"
                  aria-label="Choose a /getplayers file"
                  onchange={handleFileChange}
                />

                <label class="button choose-file" for="player-file">
                  Choose File
                </label>

                <p class="file-status" role="status">{status}</p>

                <button class="paste-button" type="button" onclick={openPasteDialog}>
                  Paste the output instead
                </button>
              </div>
            </div>
          </div>
        {:else if activeView === "config"}
          <section class="config-panel">
            <p>config panel</p>
          </section>
        {:else}
          <div class="leaderboard-content">
          <h1>Tournament Leaderboard</h1>

          <div class="leaderboard-table-wrap">
            <table class="leaderboard-table">
            <caption class="visually-hidden">
              Tournament leaderboard with player names and total points
            </caption>
            <thead>
              <tr>
                <th scope="col">Place</th>
                <th scope="col">Players</th>
                <th scope="col">Total Points</th>
              </tr>
            </thead>
            <tbody>
              {#each leaderboard as player (player.playfabID)}
                <tr
                  class:place-first={player.rank === 1}
                  class:place-second={player.rank === 2}
                  class:place-third={player.rank === 3}
                >
                  <td class="rank-cell">{player.rank}</td>
                  <td>{player.name}</td>
                  <td class="points-cell">{player.total}</td>
                </tr>
              {/each}
            </tbody>
          </table>
          </div>
        </div>
      {/if}
    </section>

    <aside class="options-panel" aria-labelledby="options-title">
      {#if activeView === "leaderboard"}
        <h2 id="options-title">Leaderboard Actions</h2>
        <button
          class="button option"
          type="button"
          onclick={exportLeaderboard}
        >
          Export Data
        </button>
        {:else}
        <h2 id="options-title">Data Options</h2>
        {#each viewOptions as option (option.id)}
          <button
            class="button option"
            class:selected={activeView === option.id}
            disabled={option.requiresPlayers && !activeRoundHasPlayers}
            type="button"
            onclick={() => changeActiveView(option.id)}
          >
            {option.label}
          </button>
        {/each}
      {/if}

      {#if status}
        <p class="status-message" role="status">{status}</p>
      {/if}
    </aside>
  </div>
</main>

<dialog class="reset-dialog" bind:this={roundWarningDialog}>
  <div class="reset-dialog-content">
    <h2>Round required</h2>
    <p>You must keep at least one round.</p>

    <div class="reset-dialog-actions">
      <button
        class="button go-back-button"
        type="button"
        onclick={() => roundWarningDialog?.close()}
      >
        OK
      </button>
    </div>
  </div>
</dialog>

<style>
  /* let the dotted import area fill the panel. */
  .main-panel.showing-import {
    display: flex;
    flex-direction: column;
  }

  .main-panel.showing-import .import-content {
    width: 100%;
    min-height: 0;
    flex: 1;
    display: flex;
  }

  .main-panel.showing-import .drop-area {
    width: 100%;
    min-height: 0;
    flex: 1;
  }

  /* these rows use the rounded bar style from the reference image. */
  .leaderboard-content {
    min-height: 500px;
  }

  .leaderboard-table-wrap {
    width: 100%;
    overflow-x: auto;
    border: 0;
    border-radius: 0;
  }

  .leaderboard-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0 14px;
    background: transparent;
  }

  .leaderboard-table th {
    padding: 10px 12px;
    text-align: left;
  }

  .leaderboard-table th:last-child,
  .leaderboard-table .points-cell {
    text-align: center;
  }

  .leaderboard-table tbody td {
    padding: 12px;
    border-top: 4px solid #694e3a;
    border-bottom: 4px solid #694e3a;
    background: #fff;
    color: #3b2a1a;
    white-space: nowrap;
  }

  .leaderboard-table tbody td:first-child {
    border-left: 4px solid #694e3a;
    border-radius: 12px 0 0 12px;
  }

  .leaderboard-table tbody td:last-child {
    border-right: 4px solid #694e3a;
    border-radius: 0 12px 12px 0;
  }

  .leaderboard-table tbody tr:last-child td {
    border-bottom: 4px solid #694e3a;
  }

  .leaderboard-table tbody tr.place-first td {
    background: #ffd84a;
  }

  .leaderboard-table tbody tr.place-second td {
    background: #d0d0d0;
  }

  .leaderboard-table tbody tr.place-third td {
    background: #ebb37a;
  }

  @media (max-width: 650px) {
    .leaderboard-content {
      min-height: 390px;
    }

    .leaderboard-table {
      min-width: 620px;
    }
  }
</style>

<dialog class="reset-dialog" bind:this={resetDialog}>
  <div class="reset-dialog-content">
    <h2>Reset tournament?</h2>
    <p>This clears the tournament rounds and imported player data.</p>

    <div class="reset-dialog-actions">
      <button
        class="button go-back-button"
        type="button"
        onclick={() => resetDialog?.close()}
      >
        Go back
      </button>
      <button
        class="button proceed-button"
        type="button"
        onclick={resetTournament}
      >
        Proceed
      </button>
    </div>
  </div>
</dialog>

<dialog class="paste-dialog" bind:this={pasteDialog}>
  <form class="paste-form" onsubmit={submitPaste}>
    <button
      class="paste-dialog-close"
      type="button"
      aria-label="Close paste dialog"
      onclick={() => pasteDialog?.close()}
    >
      Close
    </button>

    <div class="paste-dialog-layout">
      <div class="paste-textarea-wrap">
        <textarea
          bind:value={pastedOutput}
          aria-label="Pasted /getplayers output"
          placeholder="Paste the /getplayers output here"
          oninput={() => (pasteError = "")}
        ></textarea>
      </div>

      <div class="paste-instructions">
        <p>Paste the output from the /getplayers command.</p>
        <p>Include the header row so the columns can be checked.</p>

        {#if pasteError}
          <p class="paste-error" role="alert">{pasteError}</p>
        {/if}

        <button class="button paste-submit-button" type="submit">
          Submit
        </button>
      </div>
    </div>
  </form>
</dialog>