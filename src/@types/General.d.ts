export type ValueOf<T> = T[keyof T];

/////////////////////////////////////////////////

export type Mutable<T> = { -readonly [P in keyof T]: T[P] };
