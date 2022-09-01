import type { CharStream } from "./char-stream.js";
import type {
	Punctuation,
	WhiteSpace,
	Identifier,
	Predicate,
	Operator,
	Keyword,
	Digit,
	Token,
	Char,
} from "../@types/Tokens.js";

import {
	punctuations,
	variableName,
	whiteSpaces,
	punctuation,
	operators,
	keywords,
	operator,
	keyword,
	string,
	digits,
	number,
} from "../utils/token-types.js";

const identifiersAllowedAsFirstLetters = /[a-zλ_]/i;
const identifiers = "?!-<>=0123456789";

export function tokenStream(input: CharStream): TokenStream {
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Variables:

	let current: Token | undefined;

	/////////////////////////////////////////////////

	function readWhile(predicate: Predicate): string {
		let str = "";

		while (!input.eof() && predicate(input.peek())) str += input.next();

		return str;
	}

	/////////////////////////////////////////////////

	function readNumber() {
		let hasDot = false;

		const numberAsString = readWhile((char: Char): boolean => {
			if (char === ".") {
				if (hasDot) return false;
				hasDot = true;
				return true;
			}

			return isDigit(char);
		});

		const token: Token = { type: number, value: Number(numberAsString) };

		return token;
	}

	/////////////////////////////////////////////////

	function readIdentifier() {
		const identifier = readWhile(isIdentifier);

		const token: Token = isKeyword(identifier) ?
			{ type: keyword, value: identifier as Keyword } :
			{ type: variableName, value: identifier };

		return token;
	}

	/////////////////////////////////////////////////

	function readEscaped(end: Char): string {
		let escaped = false, str = "";

		input.next();

		while (!input.eof()) {
			const char = input.next();

			if (escaped) (str += char), (escaped = false);
			else if (char === "\\") escaped = true;
			else if (char === end) break;
			else str += char;
		}

		return str;
	}

	/////////////////////////////////////////////////

	function readString() {
		const token: Token = { type: string, value: readEscaped("\"") };

		return token;
	}

	/////////////////////////////////////////////////

	function skipComment(): void {
		readWhile(char => char !== "\n");
		input.next();
	}

	/////////////////////////////////////////////////

	function readNext(): Token | undefined {
		readWhile(isWhitespace);

		if (input.eof()) return undefined;

		const char = input.peek();

		if (char === "#") {
			skipComment();
			return readNext();
		}
		if (char === "\"") return readString();
		if (isDigit(char)) return readNumber();
		if (isOneOfIndetifierAllowedAsFirstLetter(char)) return readIdentifier();
		if (isPunctuation(char)) {
			const token: Token = {
				type: punctuation,
				value: input.next() as Punctuation,
			};

			return token;
		}
		if (isOperator(char)) {
			const token: Token = {
				type: operator,
				value: readWhile(isOperator) as Operator,
			};

			return token;
		}

		input.croak(
			`What is this char \`${char}\`? I don't know what to do with it!`,
		);
	}

	/////////////////////////////////////////////////

	function peek(): Token | undefined {
		return current ?? (current = readNext());
	}

	/////////////////////////////////////////////////

	function next(): Token | undefined {
		const token = current;
		current = undefined;

		return token ?? readNext();
	}

	/////////////////////////////////////////////////

	function eof(): boolean {
		return peek() === undefined;
	}

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

const isOneOfIndetifierAllowedAsFirstLetter = (char: Char): boolean =>
	identifiersAllowedAsFirstLetters.test(char);

/////////////////////////////////////////////////

const isPunctuation = (char: Char): char is Punctuation =>
	punctuations.includes(char as Punctuation);

/////////////////////////////////////////////////

const isWhitespace = (char: Char): char is WhiteSpace =>
	whiteSpaces.includes(char as WhiteSpace);

/////////////////////////////////////////////////

const isOperator = (str: string): str is Operator =>
	operators.includes(str as Operator);

/////////////////////////////////////////////////

const isKeyword = (char: Char): char is Keyword =>
	keywords.includes(char as Keyword);

/////////////////////////////////////////////////

const isIdentifier = (char: Char): char is Identifier =>
	isOneOfIndetifierAllowedAsFirstLetter(char) || identifiers.includes(char);

/////////////////////////////////////////////////

const isDigit = (char: Char): char is Digit => digits.includes(char as Digit);

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
