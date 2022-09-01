export type LooseStringAutocomplete<T extends string> = T | (string & {});

export type LooseNumberAutocomplete<T extends number> = T | (number & {});
