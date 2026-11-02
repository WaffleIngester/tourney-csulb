// represents the **maximum** place a player can be whilst still being rewarded the specified points.
export type PointRange = {
    maxPlace: number;
    points: number;
};
// point range example: [PointRange(2, 12), PointRange(5, 4)]
// -0 --> 12pts [this is invalid, but DW abt it]
// 1 --> 12pts
// 2 --> 12pts
// 3 --> 4pts
// 4 --> 4pts
// 5 --> 4pts
// 5+ --> ??? pts [anything above this would be out-of-range. enforce 0.0pts for simplicity.]



// some generic error to throw (if desired) when config erros appear
export class ConfigValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ConfigValidationError";
    }
}

// minimalist data representation for a configuration as stored/ processed by the program.
export type Config = {
    id: number;

    killCap: number;
    pointsPerKill: number;
    pointsKillLeader: number;

    pointRanges: PointRange[];
};
