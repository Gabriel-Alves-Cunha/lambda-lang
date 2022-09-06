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
	| Uppercase<Letter>
	| Letter // Lowercase
	| "λ"
	| "_"
	| "?"
	| "!"
	| "-"
	| "<"
	| ">"
	| "=";

/////////////////////////////////////////////////

export type Token =
	| VariableName_Token
	| Punctuation_Token
	| Identifier_Token
	| Operator_Token
	| Keyword_Token
	| String_Token
	| Number_Token;

export type NarrowedToken<Type, Value> = Readonly<{
	value: Value;
	type: Type;
}>;

export type Punctuation_Token = NarrowedToken<typeof punctuation, Punctuation>;

export type Identifier_Token = NarrowedToken<typeof identifier, Identifier>;

export type VariableName_Token = NarrowedToken<typeof variableName, string>;

export type Operator_Token = NarrowedToken<typeof operator, Operator>;

export type Keyword_Token = NarrowedToken<typeof keyword, Keyword>;

export type String_Token = NarrowedToken<typeof string, string>;

export type Number_Token = NarrowedToken<typeof number, number>;

/////////////////////////////////////////////////

export type Predicate = (char: Char) => boolean;

/////////////////////////////////////////////////

export type Char = Readonly<string>;
