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
	| { type: "Punctuation"; value: Punctuation; }
	| { type: "Identifier"; value: Identifier; }
	| { type: "VariableName"; value: string; }
	| { type: "Operator"; value: Operator; }
	| { type: "Keyword"; value: Keyword; }
	| { type: "String"; value: string; }
	| { type: "Number"; value: number; }
>;

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////

export type Predicate = (char: Char) => boolean;

export type ValueOf<T> = T[keyof T];
