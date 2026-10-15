# Touhou Slop Duos Sample Data
Sample datasets for testing duo scoring and team recognition.


## Format/ Conventions
All test cases use a tab-separated (TSV) format as output by the game.

Fields are separated by tab characters (`\t`, `\0x09`), not spaces. Even when the file appears aligned using whitespaces.

Player usernames/ teams are generally based on Touhou Project characters.
> Not particularly important, but if you noticed that oddity now you know.


## Available Tests
### `tdat_base.tsv`
Based used to create new test cases.

**Do not modify.** Copy if creating a new test case.

---

### `tdat1_norm.tsv` - Normal
The data here is completely normal.

The expected team order is [PC] -> [MF] -> [LK] -> [IN] -> [SD]
> **Note**: If handled properly [GHOST] should be ignored.

---

### `tdat2_name.tsv` - Player Name Change(s)
Verifies players are associated properly despite name changes. 
> Ideally, one flags the user changing their name between rounds.

Table of name changes:
| pID | original | changed |
|-----|----------|---------|
| 5   | Sanae    | Snake   |
| 8   | Reisen   | Raisin  |
| 9   | Tewi     | Teiwi   |
| 11  | Sakyua   | Sacua   |

---

### `tdat3_places.tsv` - Invalid Placements
Verifies that invalid `Placement` values are recognized and handled.

No player, except the ghosted player, has a proper placement.
> A placement of `-1` indicates one is *ghosted*

---

### `tdat4_kills.tsv` - Invalid Kill Values
Verifies that invalid `Kill` values are recognized and handled.

Players 2, 3, 4, 5, and 6 have invalid kills.

---

### `tdat5_gaps.tsv` - Placement Gaps
Verifies that gaps in `Placement` values across rows are handled.

In team-based modes, gaps can occur in placement values. For instance:
- Proper Order: 1st, 2nd, 3rd, ...
- Received Order: 1st, 3rd, 4th, ...

The relative-ordering is correct. However, due to the gaps, subsequence places are much higher than expected.

---

### `tdat6_ghost_inc.tsv` - Ghosted Teammates
Verifies that players in a team with a ghosted teammate are recognized and properly handeld.

All players have a teammate who has been *ghosted*1. 

---

### `tdat7_ghost_gap.tsv` - Ghosted Teammates + Placement Gaps
Verifies that players in a team with a ghosted teammate are recognized and properly handeld, with the addition of gaps.

---

### `tdat8_team_swap.tsv` - Team-Assignment Mismatch
Verifies that team assignments are recognized properly. Inconsistencies between rounds should be detected.

No team except for `[LK]` is as they should. 

---