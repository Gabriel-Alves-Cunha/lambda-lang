import {
	punctuations,
	variableName,
	whiteSpaces,
	punctuation,
	identifier,
	operators,
	keywords,
	operator,
	keyword,
	number,
	digits,
	string,
} from "@utils/token-types.js";

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

/////////////////////////////////////////////////

export type Punctuation = typeof punctuations[number];
export type WhiteSpace = typeof whiteSpaces[number];
export type Operator = typeof operators[number];
export type Keyword = typeof keywords[number];
export type Digit = typeof digits[number];
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

/////////////////////////////////////////////////

export type Token = Readonly<
	| { type: typeof punctuation; value: Punctuation; }
	| { type: typeof identifier; value: Identifier; }
	| { type: typeof variableName; value: string; }
	| { type: typeof operator; value: Operator; }
	| { type: typeof keyword; value: Keyword; }
	| { type: typeof string; value: string; }
	| { type: typeof number; value: number; }
>;

/////////////////////////////////////////////////

export type Predicate = (char: Char) => boolean;

/////////////////////////////////////////////////

export type Char = Readonly<string>;
