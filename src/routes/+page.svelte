<script lang="ts">
  // css
  import "./page.css";

  // round imports
  import type { Round } from "#lib/features/rounds/round-types.ts";
  import { TsvToRounds } from "#lib/features/rounds/round-actions.ts";
  
  // cfg imports
  import type { Config } from "#lib/features/configs/config-types.ts";

  // tsv imports
  import { TextToTSV } from "#lib/utils/tsv-reader.ts";
  import { TsvRow } from "#lib/utils/tsv-reader.ts";

  import { ColumnType, getTsvError, TsvValidationError } from "#lib/utils/tsv-validator.ts";
  import type { RequiredColumn } from "#lib/utils/tsv-validator.ts";

  // gamemode
  import { Gamemode } from "#lib/utils/gamemode.ts";


  // columns required when validating an imported TSV.
  // there are **no** aliases. you're either right, or you're wrong.
  //const requiredColumns: string[] = [ "pID","Player","PlayfabID","SquadID","TeamID","Kills","Placement"];
  const requiredColumns: RequiredColumn[] = [
    { name: "pID", type: ColumnType.Integer },
    { name: "Player", type: ColumnType.String },
    { name: "PlayfabID", type: ColumnType.String },
    { name: "SquadID", type: ColumnType.Integer },
    { name: "TeamID", type: ColumnType.Integer },
    { name: "Kills", type: ColumnType.Integer },
    { name: "Placement", type: ColumnType.Integer }
  ];

  let gamemode = $state(Gamemode.Solos);
  let status = $state(""); // why does this exist?
  let pastedOutput = $state("");
  let pasteError = $state("");
  let resetDialog = $state<HTMLDialogElement | null>(null);
  let pasteDialog = $state<HTMLDialogElement | null>(null);
  let fileInput = $state<HTMLInputElement | null>(null);

  let rounds = $state<Round[]>([{ id: 0, label: "Round 1", configID: 0, players: []}]);
  let activeRoundIndex = $state<number | null>(0);
  let nextRoundNumber = $state(1);

  // todo: need to actually import the file. fill figure out later I suppose.
  function handleFileChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    status = file ? `Selected: ${file.name}` : "";
  }

  function addRound() {
    if (rounds.length === 0) {
      nextRoundNumber = 0;
    }

    const round: Round = {
      id: nextRoundNumber,
      label: `Round ${nextRoundNumber}`,
      configID: 0,
      players: []
    };

    rounds = [...rounds, round];
    activeRoundIndex = round.id;
    nextRoundNumber += 1;
  }


  // todo: safety popup. make sure player understands they'll be removing the round.
  function removeRound(id: number) {
    rounds = rounds.filter((round) => round.id !== id);

    if (activeRoundIndex === id) {
      activeRoundIndex = rounds.at(-1)?.id ?? null;
    }

    if (rounds.length === 0) {
      nextRoundNumber = 0;
    }
  }

  function openResetDialog() {
    resetDialog?.showModal();
  }

  function closeResetDialog() {
    resetDialog?.close();
  }

  function resetTournament() {
    gamemode = Gamemode.Solos;
    status = "";
    pastedOutput = "";
    pasteError = "";
    rounds = [{ id: 0, label: "Round 1", configID: 0, players: []}];
    activeRoundIndex = 0;
    nextRoundNumber = 1;

    if (fileInput) {
      fileInput.value = "";
    }

    resetDialog?.close();
  }

  function openPasteDialog() {
    pasteError = "";
    pasteDialog?.showModal();
  }

  function clearPasteError() {
    pasteError = "";
  }
 
  function submitPaste(event: SubmitEvent) {
    event.preventDefault();
    pasteError = "";

    // this function already normalizes the input, more-or-less.
    const roundData: TsvRow[] = TextToTSV(pastedOutput);
    
    // any errors? --> display and **EXIT EARLY**
    const validationError = getTsvError(roundData, requiredColumns);
    if (validationError !== null) {
      pasteError = validationError.message;
      return;
    }

    status = "Output pasted. Import processing is not connected yet.";

    if (activeRoundIndex === null) {
      pasteError = "activeRoundIndex is null. This should be impossible, and yet we're here.";
      return;
    }
    rounds[activeRoundIndex].players = TsvToRounds(roundData);

    console.log(rounds[activeRoundIndex].players);

    pastedOutput = "";
    pasteDialog?.close();
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
    <button class="button" type="button" onclick={addRound}>
      Add round
    </button>

    <div class="round-tabs" aria-label="Rounds">
      {#each rounds as round (round.id)}
        <div class="round-tab" class:active={activeRoundIndex === round.id}>
          <button
            class="round-select"
            type="button"
            aria-pressed={activeRoundIndex === round.id}
            onclick={() => (activeRoundIndex = round.id)}
          >
            {round.label}
          </button>

          <button
            class="close-round"
            type="button"
            aria-label={`Remove ${round.label}`}
            onclick={() => removeRound(round.id)}
          >
            ×
          </button>
        </div>
      {/each}
    </div>

    <button class="button leaderboard" type="button">
      Leaderboard
    </button>
  </nav>

  <div class="content-layout">
    <section class="import-panel" aria-label="Import player data">
      <div class="drop-area">
        <div class="import-content">
          <p class="import-title">Import the /getplayers file</p>

          <input
            bind:this={fileInput}
            class="visually-hidden"
            id="player-file"
            type="file"
            accept=".txt,.tsv,.csv,.json"
            aria-label="Choose a /getplayers file"
            onchange={handleFileChange}
          />

          <label class="button choose-file" for="player-file">
            Choose File
          </label>

          <p class="file-status" role="status" aria-live="polite">
            {status}
          </p>

          <button
            class="paste-button"
            type="button"
            onclick={openPasteDialog}
          >
            Paste the output instead
          </button>
        </div>
      </div>
    </section>

    <aside class="options-panel" aria-labelledby="options-title">
      <h1 id="options-title">Data Options</h1>

      <button class="button option disabled" type="button" disabled>
        View Scored
      </button>

      <button class="button option disabled" type="button" disabled>
        View Unscored
      </button>

      <button
        class="button option selected"
        type="button"
        aria-pressed="true"
      >
        Replace Data
      </button>

      <button class="button option" type="button">
        Edit Scoring Rules
      </button>
    </aside>
  </div>
</main>

<dialog class="reset-dialog" bind:this={resetDialog}>
  <div class="reset-dialog-content">
    <h2>Reset tournament?</h2>

    <p>
      This deletes <strong>everything.</strong> Are you sure you want to clear
      all rounds and scoring rules?
    </p>

    <div class="reset-dialog-actions">
      <button
        class="reset-dialog-button go-back-button"
        type="button"
        onclick={closeResetDialog}
      >
        Go back
      </button>

      <button
        class="reset-dialog-button proceed-button"
        type="button"
        onclick={resetTournament}
      >
        Proceed
      </button>
    </div>
  </div>
</dialog>

<dialog class="paste-dialog" bind:this={pasteDialog}>
  <button
    class="paste-dialog-close"
    type="button"
    aria-label="Close paste dialog"
    onclick={() => pasteDialog?.close()}
  >
    Close
  </button>

  <form class="paste-dialog-layout" onsubmit={submitPaste}>
    <div class="paste-textarea-wrap">
      <textarea
        id="pasted-output"
        bind:value={pastedOutput}
        oninput={clearPasteError}
        aria-label="Paste the /getplayers output"
      ></textarea>

      {#if !pastedOutput}
        <span class="paste-placeholder">Paste data into this box!</span>
      {/if}
    </div>

    <section class="paste-instructions">
      <p>
        Once you’re ready, click submit to process the data you entered!
      </p>

      <button class="paste-submit-button" type="submit">
        Submit
      </button>

      {#if pasteError}
        <p class="paste-error" role="alert" aria-live="assertive">
          {pasteError}
        </p>
      {/if}
    </section>
  </form>
</dialog>