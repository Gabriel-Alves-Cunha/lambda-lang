import type { Char } from "../@types/Tokens.js";

export function charStream(input: Char): CharStream {
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Variables:

	let pos = 0,
		lineNum = 1,
		column = 0,
		line = readLine(pos);

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Functions:

	function readLine(position: number): string {
		const predicate = (char: Char) => char !== "\n";
		let str = "";

		while (!eof(position) && predicate(peek(position))) {
			str += peek(position);

			++position;
		}

		return str;
	}

	function next(): Char {
		// Get current char and increment position:
		const char = input.charAt(pos++);

		if (char === "\n") {
			line = readLine(pos);
			column = 0;
			++lineNum;
		} else ++column;

		return char;
	}

	/////////////////////////////////////////////////

	function peek(position?: number): Char {
		return input.charAt(position ?? pos);
	}

	/////////////////////////////////////////////////

	function eof(position?: number): boolean {
		return peek(position) === "";
	}

	/////////////////////////////////////////////////

	function croak(msg: string): never {
		throw new Error(`${msg} (At line: ${lineNum}, column: ${column}).

${lineNum} | ${line}
  | ${" ".repeat(column)}\u1403
`);
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
