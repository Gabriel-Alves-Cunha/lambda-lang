export const operators = Object.freeze(
	[
		"+",
		"-",
		"*",
		"/",
		"%",
		"=",
		"&",
		"|",
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

/////////////////////////////////////////////////

export const keywords = Object.freeze(
	["lambda", "false", "then", "else", "true", "let", "if", "λ"] as const,
);

/////////////////////////////////////////////////

export const punctuations = Object.freeze(
	[",", ";", "(", ")", "{", "}", "[", "]"] as const,
);

/////////////////////////////////////////////////

export const digits = Object.freeze(
	["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const,
);

/////////////////////////////////////////////////

export const whiteSpaces = Object.freeze([" ", "\t", "\n"] as const);
export const variableName = "VariableName";
export const punctuation = "Punctuation";
export const identifier = "Identifier";
export const operator = "Operator";
export const keyword = "Keyword";
export const string = "String";
export const number = "Number";
