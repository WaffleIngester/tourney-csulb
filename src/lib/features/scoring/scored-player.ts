import type { RoundPlayer } from "#lib/features/rounds/round-types.ts";

export class ScoredPlayer implements RoundPlayer {
    public readonly pID: number;
    public readonly player: string;
    public readonly playfabID: string;
    public readonly squadID: number;
    public readonly teamID: number;
    public readonly kills: number;
    public placement: number;
    public readonly trueScore: number;

    public killPts: number;
    public killLeaderPts: number;
    
    constructor (player: RoundPlayer) {
        this.pID = player.pID;
        this.player = player.player;
        this.playfabID = player.playfabID;
        this.squadID = player.squadID;
        this.teamID = player.teamID;
        this.kills = player.kills;
        this.placement = player.placement;
        this.trueScore = player.trueScore;

        this.killPts = 0.0;
        this.killLeaderPts = 0.0;
    }

    get points(): number {
        return this.killPts + this.killLeaderPts;
    }
};
