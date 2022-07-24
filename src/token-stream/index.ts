import { CharStream } from "./char-stream";
import {
	punctuations,
	Punctuation,
	whiteSpaces,
	WhiteSpace,
	operators,
	Predicate,
	Operator,
	keywords,
	Keyword,
	Token,
	Char,
} from "../@types/general-types";

const identifiersAllowedFirstLetters = /[a-zλ_]/i;
const identifiers = "?!-<>=0123456789";
const digit = /[0-9]/i;

export function tokenStream(input: CharStream): TokenStream {
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Variables:

	let current: Token | undefined;

	/////////////////////////////////////////////////

	const readWhile = (predicate: Predicate): string => {
		let str = "";

		while (!input.eof() && predicate(input.peek())) str += input.next();

		return str;
	};

	/////////////////////////////////////////////////

	const readNumber = (): Token => {
		let hasDot = false;

		const number = readWhile((char: Char): boolean => {
			if (char === ".") {
				if (hasDot) return false;
				hasDot = true;
				return true;
			}

			return isDigit(char);
		});

		const token: Token = { type: "Number", value: Number(number) };

		return token;
	};

	/////////////////////////////////////////////////

	const readIdentifier = (): Token => {
		const identifier = readWhile(isIdentifier);

		const token: Token = isKeyword(identifier) ?
			{ type: "Keyword", value: identifier as Keyword } :
			{ type: "VariableName", value: identifier };

		return token;
	};

	/////////////////////////////////////////////////

	const readEscaped = (end: Char): string => {
		let escaped = false, str = "";

		input.next();

		while (!input.eof()) {
			const char = input.next();

			if (escaped)
				str += char, escaped = false;
			else if (char === "\\")
				escaped = true;
			else if (char === end)
				break;
			else str += char;
		}

		return str;
	};

	/////////////////////////////////////////////////

	const readString = (): Token => {
		const token: Token = { type: "String", value: readEscaped("\"") };

		return token;
	};

	/////////////////////////////////////////////////

	const skipComment = (): void => {
		readWhile((char: Char) => char !== "\n");
		input.next();
	};

	/////////////////////////////////////////////////

	const readNext = (): Token | undefined => {
		readWhile(isWhitespace);

		if (input.eof()) return undefined;

		const char = input.peek();

		if (char === "#") {
			skipComment();
			return readNext();
		}
		if (char === "\"") return readString();
		if (isDigit(char)) return readNumber();
		if (isOneOfIndetifierAllowedFirstLetter(char)) return readIdentifier();
		if (isPunctuation(char)) {
			const token: Token = {
				type: "Punctuation",
				value: input.next() as Punctuation,
			};

			return token;
		}
		if (isOperator(char)) {
			const token: Token = {
				type: "Operator",
				value: readWhile(isOperator) as Operator,
			};

			return token;
		}

		input.croak(
			`What is this char "${char}"? I don't know what to do with it!`,
		);
	};

	/////////////////////////////////////////////////

	const peek = (): Token | undefined => current ?? (current = readNext());

	/////////////////////////////////////////////////

	const next = (): Token | undefined => {
		const token = current;
		current = undefined;

		return token ?? readNext();
	};

	/////////////////////////////////////////////////

	const eof = (): boolean => peek() === undefined;

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Return:

	const tokenStream: TokenStream = { croak: input.croak, peek, next, eof };

	return tokenStream;
}

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
// Helper functions:

const isOneOfIndetifierAllowedFirstLetter = (char: Char): boolean =>
	identifiersAllowedFirstLetters.test(char);

/////////////////////////////////////////////////

const isPunctuation = (char: Char): boolean =>
	punctuations.includes(char as Punctuation);

/////////////////////////////////////////////////

const isWhitespace = (char: Char): boolean =>
	whiteSpaces.includes(char as WhiteSpace);

/////////////////////////////////////////////////

const isOperator = (str: string): boolean =>
	operators.includes(str as Operator);

/////////////////////////////////////////////////

const isKeyword = (char: Char): boolean => keywords.includes(char as Keyword);

/////////////////////////////////////////////////

const isIdentifier = (char: Char): boolean =>
	isOneOfIndetifierAllowedFirstLetter(char) || identifiers.includes(char);

/////////////////////////////////////////////////

const isDigit = (char: Char): boolean => digit.test(char);

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
// Types:

export type TokenStream = Readonly<
	{
		croak(msg: string): never;
		next(): Token | undefined;
		peek(): Token | undefined;
		eof(): boolean;
	}
>;
