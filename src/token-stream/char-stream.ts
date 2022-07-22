import type { Char } from "../@types/general-types";

export function charStream(input: Readonly<string>): CharStream {
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Variables:

	let pos = 0, line = 1, column = 0;

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Functions:

	const next = (): Char => {
		// Get current char and increment pos:
		const char = input.charAt(pos++);

		if (char === "\n") ++line, column = 0;
		else ++column;

		return char;
	};

	/////////////////////////////////////////////////

	const peek = (): Char => input.charAt(pos);

	/////////////////////////////////////////////////

	const eof = (): boolean => peek() === "";

	/////////////////////////////////////////////////

	const croak = (msg: string): never => {
		throw new Error(
			`${msg} (at line: ${line}, column: ${column}, pos: ${pos}).`,
		);
	};

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
	/** Returns the next value but without removing it from the stream. */
	peek(): Char;
	/** Returns the next value and also discards it from the stream. */
	next(): Char;
	/** Returns true if and only if there are no more values in the stream. */
	eof(): boolean;
	/** Does `throw new Error(msg)` so that the stream can easily keep track
	 * of the current location (i.e. line/column), which is important to
	 * display in the case of an error message. */
	croak(msg: string): never;
}>;
