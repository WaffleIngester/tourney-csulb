export enum Gamemode {
    Solos = "solos",
    Duos = "duos",
    //Trios = "trios",
    Squads = "squads"
}


export function getMaxTeamSizeForGamemode(mode: Gamemode): number {
    switch (mode) {
        case Gamemode.Solos:
            return 1;
        case Gamemode.Duos:
            return 2;
        //case Gamemode.Trios:
           // return 3;
        case Gamemode.Squads:
            return 4;
        default:
            throw new Error(`Unknown team size for gamemode \"${mode}\".`);
    }
}

