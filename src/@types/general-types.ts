export type Char = Readonly<string>;

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

export const operators = Object.freeze(
	[
		"+",
		"-",
		"*",
		"/",
		"%",
		"=",
		// "&",
		// "|",
		"<",
		">",
		"!",
		"&&",
		"||",
		"<=",
		">=",
		"==",
		"!=",
	] as const,
);

export const keywords = Object.freeze(
	["lambda", "false", "then", "else", "true", "if", "λ", "let"] as const,
);

export const punctuations = Object.freeze(
	[",", ";", "(", ")", "{", "}", "[", "]"] as const,
);

export const whiteSpaces = Object.freeze([" ", "\t", "\n"] as const);

type Letter =
	| "a"
	| "b"
	| "c"
	| "d"
	| "e"
	| "f"
	| "g"
	| "h"
	| "i"
	| "j"
	| "k"
	| "l"
	| "m"
	| "n"
	| "o"
	| "p"
	| "q"
	| "r"
	| "s"
	| "t"
	| "u"
	| "v"
	| "w"
	| "x"
	| "y"
	| "z";

export type Punctuation = typeof punctuations[number];
export type WhiteSpace = typeof whiteSpaces[number];
export type Operator = typeof operators[number];
export type Keyword = typeof keywords[number];
export type Identifier =
	| Lowercase<Letter>
	| Uppercase<Letter>
	| "λ"
	| "_"
	| "?"
	| "!"
	| "-"
	| "<"
	| ">"
	| "=";

export type Token = Readonly<
	// Specifics:
	| { type: typeof punctuation; value: Punctuation; }
	| { type: typeof identifier; value: Identifier; }
	| { type: typeof variableName; value: string; }
	| { type: typeof operator; value: Operator; }
	| { type: typeof keyword; value: Keyword; }
	| { type: typeof string; value: string; }
	| { type: typeof number; value: number; }
>;

export const variableName = "VariableName";
export const punctuation = "Punctuation";
export const identifier = "Identifier";
export const operator = "Operator";
export const keyword = "Keyword";
export const string = "String";
export const number = "Number";

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

export type Predicate = (char: Char) => boolean;

export type ValueOf<T> = T[keyof T];
