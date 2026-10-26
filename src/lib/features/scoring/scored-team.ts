import type { ScoredPlayer } from "./scored-player";

export class ScoredTeam {
    private _placement = 0;
    private _placementPoints: number = 0;
    private _members: Map<string, ScoredPlayer> = new Map<string, ScoredPlayer>();


    // add a new player to the team based on their stored PlayFabID.
    addPlayer(player: ScoredPlayer): void {
        this._members.set(player.playfabID, player);
    }


    // assign the given placement score to each member...
    assignPlacement(place: number): void {
        this._placement = place;
    }

    
    // assign new placement score. use wisely.
    assignPlacementPoints(points: number): void {
        this._placementPoints = points;
    }


    // return size of this team.
    get size(): number {
        return this._members.size;
    }


    // local associated squad id.
    get localId(): number {
        const members = this.teamMembers;
        if (members[0] === undefined) {
            throw new Error("Tried to check local squad-id for a team which has no members.");
        }
        return members[0].squadID;
    }


    // return team members as an array.
    get teamMembers(): ScoredPlayer[] {
        return [...this._members.values()];
    }


    // return current placement.
    get placement(): number {
        return this._placement;
    }


    // return the placement points assigned to this team.
    get placementPoints(): number {
        return this._placementPoints;
    }

    // return the total individual points, exlcuding placement points.
    get memberPoints(): number {
        let total: number = 0;
        for (const player of this._members.values()) {
            total += player.points;
        }
        return total;
    }


    // return full team points - placement + members.
    get teamPoints(): number {
        return this.memberPoints + this._placementPoints;
    }
}
