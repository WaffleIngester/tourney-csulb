import type { Config } from "#lib/features/configs/config-types.ts";
import type { RoundPlayer } from "#lib/features/rounds/round-types.ts";
import { ScoredPlayer } from "./scored-player";
import { ScoredTeam } from "./scored-team";

const GHOST_SQUAD_ID = -1;

export class ScoringError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ScoringError";
    }
}


// helper function: determine whether the provided ScoredTeam array contains a ghost-squad.
function hasGhostedSquad(squads: ScoredTeam[]): boolean {
    for (const squad of squads) {
        if (squad.localId == GHOST_SQUAD_ID) {
            return true;
        }
    }
    return false;
}


// helper function: sort players in ascending order by their placements.
function sortPlayersByPlacement(players: RoundPlayer[]): RoundPlayer[] {
    let max = players.length;
    for (let i = 0; i < max; ++i) {
        let minIndex = i;
        for (let j = (i + 1); j < max; ++j) {
            if (players[j].placement < players[minIndex].placement) {
                minIndex = j;
            }
        }

        let tmp: RoundPlayer = players[i];
        players[i] = players[minIndex];
        players[minIndex] = tmp;
    }
    return players;
}


// calculates a player individaul score. **does not take into consideration placement. that is for "team"**
function calculatePlayerScores(config: Config, players: RoundPlayer[]): ScoredPlayer[] {
    const scoredPlayers: ScoredPlayer[] = [];
    let killLeaders: ScoredPlayer[] = [];

    // begin: generate/ basic-score players
    for (const player of players) {
        const tmpPlayer = new ScoredPlayer(player);

        // begin: apply scoring rules

        // kill caps
        tmpPlayer.kills = Math.max(0, player.kills);
        if (config.killCap > 0) {
            tmpPlayer.kills = Math.min(tmpPlayer.kills, config.killCap)
        }
        tmpPlayer.killPts = tmpPlayer.kills * config.pointsPerKill;

        // TODO: flag that a player has been kill-capped and show it.

        // it's a bit redundant to allow kill-leaders AND a kill-cap simultaneously... Well, may as well...
        // ... let event hosts make decision should they choose to.
        if (tmpPlayer.kills > 0) {
            if (killLeaders.length === 0) {
                killLeaders.push(tmpPlayer);
            } else if (tmpPlayer.kills > killLeaders[0].kills) {
                killLeaders = [tmpPlayer];
            } else if (tmpPlayer.kills === killLeaders[0].kills) {
                killLeaders.push(tmpPlayer);
            }
        }
        // end: apply scoring rules
        scoredPlayers.push(tmpPlayer);
    }
    // end: generate/ basic-score players

    // award kill-leader points to leader(s).
    if (config.pointsKillLeader > 0) {
        for (const leader of killLeaders) {
            leader.killLeaderPts = config.pointsKillLeader;
        }
    }

    // FIN.
    return scoredPlayers;
}


// create squads from the scored players & provided team-size.
function createSquads(maxTeamSize: number, players: ScoredPlayer[]): ScoredTeam[] {
    const associationSquads: Map<number, ScoredTeam> = new Map<number, ScoredTeam>();

    for (const player of players) {
        if (!associationSquads.has(player.squadID)) {
            associationSquads.set(player.squadID, new ScoredTeam())
        }

        const _squad = associationSquads.get(player.squadID);
        if (_squad === undefined) {
            throw new ScoringError(`TeamID ${player.squadID}: Squad is not actually stored. How?`);
        }

        if (_squad.size === maxTeamSize && (player.squadID !== GHOST_SQUAD_ID)) {
            throw new ScoringError(`TeamID ${player.squadID}: Trying to add too many members.`);
        }
        _squad.addPlayer(player);
    }
    return [...associationSquads.values()]; // I LOVE JAVASCRIPT
}


// helper: reorder squad placements.
function reassignSquadPlacements(squads: ScoredTeam[]): void {
    // wait... squads are already in ascending order. just need to make sequential.
    const maxPlace = hasGhostedSquad(squads) ? (squads.length - 1) : squads.length;
    let nextPlace = 1;

    for (let i = 0; i < maxPlace; ++i) {
        // there is only one ghost squad that can exist. safely skipping over, should it not actually be at the start (as it should)
        if (squads[i].localId === GHOST_SQUAD_ID) {
            continue;
        }

        squads[i].assignPlacement(nextPlace);
        nextPlace++;
    }
}


// calculate placement points for a squad...
function assignPlacementPoints(config: Config, squads: ScoredTeam[]): void {
    for (let squad of squads) {
        if (squad.localId === GHOST_SQUAD_ID) {
            continue;
        }

        // ok actually calculate range we're within.
        for (const pointRange of config.pointRanges) {
            if (squad.placement <= pointRange.maxPlace) {
                squad.assignPlacementPoints(pointRange.points);
                break;
            }
        }
    }
}


export function calculateScores(maxTeamSize: number, config: Config, players: RoundPlayer[]): ScoredTeam[] {
    if (players[0] === undefined) {
        throw new ScoringError("There are no player scores to calculate.");
    }

    const sortedPlayers = [...players].sort( (a, b) => a.placement - b.placement);
    //const sortedPlayers = sortPlayersByPlacement([...players]);

    const scoredPlayers: ScoredPlayer[] = calculatePlayerScores(config, sortedPlayers);

    const squads = createSquads(maxTeamSize, scoredPlayers);
    reassignSquadPlacements(squads);
    assignPlacementPoints(config, squads);



    return squads.sort((a, b) => b.teamPoints - a.teamPoints);
}