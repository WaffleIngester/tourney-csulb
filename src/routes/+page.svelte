<script lang="ts">
  import "./page.css";

  type Round = {
    id: number;
    label: string;
  };

  type RequiredColumn = {
    label: string;
    aliases: string[];
  };

  const requiredColumns: RequiredColumn[] = [
    { label: "pID", aliases: ["pid", "playerid"] },
    { label: "Player", aliases: ["player", "playername"] },
    { label: "PlayFab", aliases: ["playfab", "playfabid"] },
    { label: "SquadID", aliases: ["squadid"] },
    { label: "TeamID", aliases: ["teamid"] },
    { label: "Kills", aliases: ["kills"] },
    { label: "Placement", aliases: ["placement", "place"] }
  ];

  let gamemode = $state("Solos");
  let status = $state("");
  let pastedOutput = $state("");
  let pasteError = $state("");
  let resetDialog = $state<HTMLDialogElement | null>(null);
  let pasteDialog = $state<HTMLDialogElement | null>(null);
  let fileInput = $state<HTMLInputElement | null>(null);

  let rounds = $state<Round[]>([{ id: 1, label: "Round 1" }]);
  let activeRoundId = $state<number | null>(1);
  let nextRoundNumber = $state(2);

  function handleFileChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    status = file ? `Selected: ${file.name}` : "";
  }

  function addRound() {
    if (rounds.length === 0) {
      nextRoundNumber = 1;
    }

    const round: Round = {
      id: nextRoundNumber,
      label: `Round ${nextRoundNumber}`
    };

    rounds = [...rounds, round];
    activeRoundId = round.id;
    nextRoundNumber += 1;
  }

  function removeRound(id: number) {
    rounds = rounds.filter((round) => round.id !== id);

    if (activeRoundId === id) {
      activeRoundId = rounds.at(-1)?.id ?? null;
    }

    if (rounds.length === 0) {
      nextRoundNumber = 1;
    }
  }

  function openResetDialog() {
    resetDialog?.showModal();
  }

  function closeResetDialog() {
    resetDialog?.close();
  }

  function resetTournament() {
    gamemode = "Solos";
    status = "";
    pastedOutput = "";
    pasteError = "";
    rounds = [{ id: 1, label: "Round 1" }];
    activeRoundId = 1;
    nextRoundNumber = 2;

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

  function normalizeHeader(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function submitPaste(event: SubmitEvent) {
    event.preventDefault();
    pasteError = "";

    const firstLine =
      pastedOutput
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/)
        .find((line) => line.trim().length > 0) ?? "";

    if (!firstLine) {
      pasteError = "ERROR: Paste data into the box before submitting.";
      return;
    }

    const headerCells = firstLine
      .split(/[\t,|;]+/)
      .map(normalizeHeader)
      .filter(Boolean);

    const normalizedLine = normalizeHeader(firstLine);
    const hasSeparatedHeaders = headerCells.length > 1;

    const missingColumns = requiredColumns.filter((column) => {
      return !column.aliases.some((alias) => {
        const normalizedAlias = normalizeHeader(alias);

        return hasSeparatedHeaders
          ? headerCells.includes(normalizedAlias)
          : normalizedLine.includes(normalizedAlias);
      });
    });

    if (missingColumns.length > 0) {
      if (missingColumns.length === 1) {
        pasteError = `ERROR: Missing column '${missingColumns[0].label}'.`;
      } else {
        const missingNames = missingColumns
          .map((column) => `'${column.label}'`)
          .join(", ");

        pasteError = `ERROR: Missing columns ${missingNames}.`;
      }

      return;
    }

    status = "Output pasted. Import processing is not connected yet.";
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
        <option>Solos</option>
        <option>Duos</option>
        <option>Squads</option>
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
        <div class="round-tab" class:active={activeRoundId === round.id}>
          <button
            class="round-select"
            type="button"
            aria-pressed={activeRoundId === round.id}
            onclick={() => (activeRoundId = round.id)}
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
            accept=".txt,.csv,.json"
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