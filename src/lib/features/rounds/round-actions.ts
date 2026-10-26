
import { TsvRow } from "#lib/utils/tsv-reader.ts";

import type { RoundPlayer} from "./round-types.ts";


// gets a required column...
function getRequiredColumn(row: TsvRow, column: string): string {
    const value = row.get(column);

    if (value === undefined) {
        throw new Error(`Attempted to convert invalid TSV data: missing column ${column}.`);
    }
    return value;
}
    
// by the time we call this function, we know for a **fact** that the data is valid.
// if you are calling this function on TsvRow objects which are not up-to-spec... That's a YOU problem.
// if there are any errors with this function, that's entirely the fault of this function.
export function TsvToRoundPlayers(data: TsvRow[]): RoundPlayer[] {
    const players: RoundPlayer[] = [];
    
    for (const row of data) {
        players.push(
            {
                pID: Number(getRequiredColumn(row, "pID")),
                player: getRequiredColumn(row, "Player"),
                playfabID: getRequiredColumn(row, "PlayfabID"),
                squadID: Number(getRequiredColumn(row, "SquadID")),
                teamID: Number(getRequiredColumn(row, "TeamID")),
                kills: Number(getRequiredColumn(row, "Kills")),
                placement: Number(getRequiredColumn(row, "Placement")),

                // unused, for now.
                trueScore: 0
            }
        );
    }
    return players;
}