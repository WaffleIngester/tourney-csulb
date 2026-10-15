# Game Workings Documentation

## `/getplayers`
The data received from this command is what this program requires/ processes.

### pID
The ID assigned to a player when they joined.

>This is unused for the most part. Only useful for displaying raw data, if interested.

### Player
Username associated with the player.

### PlayfabID
PlayFabID associated with a particular player/ user account.
>PlayFab IDs are unique identifiers.

### SquadID
The ID of the squad a player belong to.

While called "SquadID", this is actually used in the duos/ squad game modes.

**Note**: In solos, *all players* have a SquadID of `-1`. However, in team-based modes (duos, squads, mystery), a SquadID of `-1` indicates a `ghosted` player.

>**Not to be confused with "TeamID".**

### TeamID
The ID of the team a player belongs to.

> This is only used in Bwocking Dead/ SvR. Otherwise, `-1` at all times.

### Kills
The number of kills a player has.

`-1` typically indicates the player killed themselves.

### Placement
The placement a player was assigned.

Unfortunately, a placement of `-1` is not of much value.

It could either mean the round was in progress, the player hasn't received a placement yet, and or the player was ghosted.
> This is to say, placements tell us little information.

### TrueScore
Unsure what this is for.

>Assuming it is a built-in placement correction.