import { TsvValidationError } from "./tsv-validator";

// represents a row of TSV data. **May have duplicate entries**
export class TsvRow {
    constructor (public readonly columns: string[], public readonly values: string[]) {
        this.columns = columns;
        this.values = values;
    }

    get(column: string) : string | undefined {
        const index = this.columns.indexOf(column);

        if (index === -1) {
            return undefined;
        }
        return this.values[index];
    }
}

// Create an arrow of TsvRow(s) from <text input> and a <delimiter> (defaults to TAB)
export function TextToTSV(text: string, delimiter: string = '\t') {
    if (text.trim() === "") { return []; }

    // Got this from AI. Forgot about different line-endings/ UTF-8 BOM...
    text = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    const rows: string[] = text.split('\n'); // shouldn't be blank bc other check above...
    const columns: string[] = rows[0].split(delimiter);
    
    // column validation...
    if (columns.length === 0) { throw new TsvValidationError("Invalid column data."); }
    for (let i = 0; i < columns.length; ++i) {
        if (columns[i] === "") { throw new TsvValidationError(`Column ${i + 1} has no data.`); }
    }


    // build it up...
    const data: TsvRow[] = [];
    for (var i = 1; i < rows.length; ++i) {
        const row_data = rows[i].trim().split(delimiter);

        if (row_data.length !== columns.length) {
            throw new TsvValidationError(`Row ${i + 1} has ${row_data.length} entries. Expected: ${columns.length}`);
        }

        data.push(new TsvRow(columns, row_data));
    }

    return data;
}
