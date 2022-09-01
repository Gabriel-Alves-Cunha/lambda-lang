import type { Char } from "../@types/Tokens.js";

export function charStream(input: Char): CharStream {
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Variables:

	let pos = 0, line = 1, column = 0;

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Functions:

	function next(): Char {
		// Get current char and increment position:
		const char = input.charAt(pos++);

		if (char === "\n") ++line, (column = 0);
		else ++column;

		return char;
	}

	/////////////////////////////////////////////////

	function peek(): Char {
		return input.charAt(pos);
	}

	/////////////////////////////////////////////////

	function eof(): boolean {
		return peek() === "";
	}

	/////////////////////////////////////////////////

	function croak(msg: string): never {
		throw new Error(`${msg} (at line: ${line}, column: ${column}).`);
	}

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Return:

	const stream: CharStream = { croak, peek, next, eof };

	return stream;
}

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
// Types:

export type CharStream = Readonly<{
	/** Does `throw new Error(msg)` so that the stream can easily keep track
	 * of the current location (i.e. line/column), which is important to
	 * display in the case of an error message. */
	croak(msg: string): never;
	/** Returns true if and only if there are no more values in the stream. */
	eof(): boolean;
	/** Returns the next value but without removing it from the stream. */
	peek(): Char;
	/** Returns the next value and also discards it from the stream. */
	next(): Char;
}>;
