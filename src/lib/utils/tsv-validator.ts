import { TsvRow } from "./tsv-reader";

// error created when validating Tsv-related data.
export class TsvValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TsvValidationError";
    }
}

// specific type a column is. we never get booleans nor normal-numbers (decimals). just integers and strings.
export enum ColumnType {
    String = "string",
    Integer = "integer"
}


// for noting required columns in TSV data.
export type RequiredColumn = {
    name: string;
    type: ColumnType;
};

export function isValidColumnValue(value: string | undefined, type: ColumnType) {
    if ((value === undefined) || (value === "")) {
        return false;
    }

    const trimmed = value.trim();
    switch (type) {
        case ColumnType.String:
            return true;
        case ColumnType.Integer:
            return (!Number.isNaN(trimmed) && Number.isSafeInteger(Number(trimmed)));
    }
}

export function getTsvError(data: TsvRow[], requiredColumns: RequiredColumn[]): TsvValidationError | null {
    if (data.length === 0) {
        return new TsvValidationError("There is no data");
    }

    // gather missing columns (if any)
    const missingColumns: string[] = [];
    for (const column of requiredColumns) {
        if (data[0].get(column.name) === undefined) {
            missingColumns.push(column.name);
        }
    }
    if (missingColumns.length !== 0) {
      return new TsvValidationError(`Missing column(s): ${missingColumns.map(col => `\"${col}\"`).join(", ")}`);
    }

    // we have all columns... but is the data there valid?
    for (let i = 0; i < data.length; ++i) {
        for (const column of requiredColumns) {
            if (!isValidColumnValue(data[i].get(column.name), column.type)) {
                return new TsvValidationError(`Invalid value for \"${column.name}\" in row ${i + 1}. Expected a(n) \"${column.type}\"`);
            }
        }
    }
    
    // no errors to return! <3
    return null;
} 
