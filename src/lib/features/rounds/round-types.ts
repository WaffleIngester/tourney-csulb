// represents a round-player. essentially the raw data stored in a row of data received from `/getplayers`.
export type RoundPlayer = {
    pID: number;
    player: string;
    playfabID: string;
    squadID: number;
    teamID: number;
    kills: number;
    placement: number;

    // TrueScore - I am not sure what this does, nor whether it works properly.
    trueScore: number;
};

// minimal representation of a "round" as stored by the program.
export type Round = {
    id: string; // identifier; maybe-used

    configID: number; // config id# --- must **always** be a valid index to the main program's config-array. 

    readonly players: RoundPlayer[]; // loaded player data from a tsv import
};