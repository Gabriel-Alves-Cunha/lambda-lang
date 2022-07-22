import { Char, Operator, ValueOf } from "../@types/general-types";
import { TokenStream } from "../token-stream";

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
// Constants:

const FALSE: AST = Object.freeze({ type: "Boolean", value: false } as const);

const PRECEDENCE: Readonly<Record<Operator, number>> = Object.freeze(
	{
		"=": 1,
		"||": 2,
		"&&": 3,
		"<": 7,
		">": 7,
		"<=": 7,
		">=": 7,
		"==": 7,
		"!=": 7,
		"+": 10,
		"-": 10,
		"*": 20,
		"/": 20,
		"%": 20,
	} as const,
);

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
// Main function:

export function parse(input: TokenStream): AST {
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Assertions functions:

	const isPunctuation = (char: Char) => {
		const token = input.peek();

		return token && token.type === "Punctuation" &&
				(!char || token.value === char) && token ?
			token :
			false;
	};

	/////////////////////////////////////////////////

	const isKeyword = (keyword: string) => {
		const token = input.peek();

		return token && token.type === "Keyword" &&
				(!keyword || token.value === keyword) && token ?
			token :
			false;
	};

	/////////////////////////////////////////////////

	const isOperator = (operator?: string) => {
		const token = input.peek();

		return token && token.type === "Operator" &&
				(!operator || token.value === operator) ?
			token :
			false;
	};

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Skip functions:

	const skipPunctuation = (char: Char): void => {
		if (isPunctuation(char)) input.next();
		else input.croak(`Expected punctuation "${char}".`);
	};

	/////////////////////////////////////////////////

	const skipKeyword = (keyword: string): void => {
		if (isKeyword(keyword)) input.next();
		else input.croak(`Expected keyword "${keyword}".`);
	};

	/////////////////////////////////////////////////

	const skipOperator = (operator: string): void => {
		if (isOperator(operator)) input.next();
		else input.croak(`Expected operator "${operator}".`);
	};

	/////////////////////////////////////////////////

	const unexpected = (): never =>
		input.croak(`Unexpected token: ${JSON.stringify(input.peek(), null, 2)}`);

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Delimiters functions:

	const delimitedAST = (
		start: Char,
		stop: Char,
		separator: Char,
		parser: () => AST,
	): readonly AST[] => {
		const result: AST[] = [];
		let first = true;

		skipPunctuation(start);

		while (!input.eof()) {
			if (isPunctuation(stop)) break;
			if (first) first = false;
			else skipPunctuation(separator);
			if (isPunctuation(stop)) break; // The last separator can be missing.

			result.push(parser());
		}

		skipPunctuation(stop);

		return result;
	};

	/////////////////////////////////////////////////

	const delimitedString = (
		start: Char,
		stop: Char,
		separator: Char,
		parser: () => string,
	): readonly string[] => {
		const result: string[] = [];
		let first = true;

		skipPunctuation(start);

		while (!input.eof()) {
			if (isPunctuation(stop)) break;
			if (first) first = false;
			else skipPunctuation(separator);
			if (isPunctuation(stop)) break; // The last separator can be missing.

			result.push(parser());
		}

		skipPunctuation(stop);

		return result;
	};

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// `maybe-*`'s functions:

	const maybeCall = (parseCurrentExpression: () => AST) => {
		const functionOrFunctionBody = parseCurrentExpression();

		return isPunctuation("(") ?
			parseFunctionCall(functionOrFunctionBody) :
			functionOrFunctionBody;
	};

	/////////////////////////////////////////////////

	const maybeBinary = (left: AST, myPredecence: Precedence): AST => {
		const token = isOperator();

		if (token) {
			const leftPredecence = PRECEDENCE[token.value];

			if (leftPredecence > myPredecence) {
				input.next();

				const right = maybeBinary(parseAtom(), leftPredecence);
				const ast: AST = token.value === "=" ?
					{ type: "Assign", operator: token.value, right, left } :
					{ type: "Binary", operator: token.value, right, left };

				return maybeBinary(ast, myPredecence);
			}
		}

		return left;
	};

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Parse functions:

	const parseTopLevel = (): AST => {
		const program: AST[] = [];

		while (!input.eof()) {
			console.log("program =", JSON.stringify(program, null, 2));

			program.push(parseExpression());

			if (!input.eof()) skipPunctuation(";"); // Using this, we demand semicolons between expressions.
		}

		const ast: AST = { type: "Program", program };

		return ast;
	};

	/////////////////////////////////////////////////

	const parseVariableName = (): string => {
		const name = input.next();

		if (name?.type !== "Variable name")
			input.croak(
				`Expected input of type "Variable name", got input = ${
					JSON.stringify(input, null, 2)
				}.`,
			);

		return name.value;
	};

	/////////////////////////////////////////////////

	const parseIf = (): AST => {
		skipKeyword("if");

		const condition = parseExpression();

		if (!isPunctuation("{")) skipKeyword("then");

		const then = parseExpression();

		let else_;
		if (isKeyword("else")) {
			input.next();
			else_ = parseExpression();
		}

		const result: AST = else_ ?
			{ type: "if", condition, then, else: else_ } :
			{ type: "if", condition, then };

		return result;
	};

	/////////////////////////////////////////////////

	const parseProgram = (): AST => {
		const program = delimitedAST("{", "}", ";", parseExpression);

		if (program.length === 0) return FALSE;
		if (program.length === 1) return program[0] as AST;

		const ast: AST = { type: "Program", program };

		return ast;
	};

	/////////////////////////////////////////////////

	const parseLambda = (): AST => {
		const ast: AST = {
			type: "lambda (function)",
			variableNames: delimitedString("(", ")", ",", parseVariableName),
			body: parseExpression(),
		};

		return ast;
	};

	/////////////////////////////////////////////////

	const parseFunctionCall = (fn: AST): AST => {
		const ast: AST = {
			args: delimitedAST("(", ")", ",", parseExpression),
			type: "Function call",
			fn,
		};

		return ast;
	};

	/////////////////////////////////////////////////

	const parseBoolean = (): AST => {
		const ast: AST = { type: "Boolean", value: input.next()?.value === "true" };

		return ast;
	};

	/////////////////////////////////////////////////

	const parseExpression = (): AST =>
		maybeCall(() => maybeBinary(parseAtom(), 0));

	/**
	 * Does the main dispatching job, depending on the current token.
	 *
	 * If it sees an open paren, then it must be a parenthesized
	 * expression — thus, skip over paren, call `parse_expression()`
	 * and expect a closing paren. If it sees some keyword, it calls
	 * the appropriate parser function. If it sees a constant or an
	 * identifier, it's just returned as is. And if nothing works,
	 * unexpected() will throw an error.
	 */
	const parseAtom = (): AST =>
		maybeCall((): AST => {
			if (isPunctuation("(")) {
				input.next();

				const expression = parseExpression();

				skipPunctuation(")");

				return expression;
			}

			// This is the proper place to implement unary operators.
			// Following is the code for boolean negation, which is present
			// in the final version of lambda.js, but I'm leaving it out
			// here since support for it is not implemented in the interpreter
			// nor compiler, in this tutorial:
			//
			// if (is_op("!")) {
			//     input.next();
			//     return {
			//         type: "not",
			//         body: parse_atom()
			//     };
			// }

			if (isPunctuation("{")) return parseProgram();
			if (isKeyword("if")) return parseIf();
			if (isKeyword("true") || isKeyword("false")) return parseBoolean();
			if (isKeyword("lambda") || isKeyword("λ")) {
				input.next();
				return parseLambda();
			}

			const token = input.next();

			if (token) {
				if (token.type === "Variable name" || token.type === "String")
					return token;
				if (token.type === "Number")
					return token;
			}

			return unexpected();
		});

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Return:

	return parseTopLevel();
}

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
// Types:

export type AST = Readonly<
	| { type: "lambda (function)"; variableNames: readonly string[]; body: AST; }
	| { type: "Binary"; operator: Operator; left: AST; right: AST; }
	| { type: "Function call"; args: readonly AST[]; fn: AST; }
	| { type: "Assign"; operator: "="; left: AST; right: AST; }
	| { type: "if"; condition: AST; then: AST; else?: AST; }
	| { type: "Program"; program: readonly AST[]; }
	| { type: "Boolean"; value: true | false; }
	| { type: "Variable name"; value: string; }
	| { type: "Number"; value: number; }
	| { type: "String"; value: string; }
>;

/////////////////////////////////////////////////

type Precedence = ValueOf<typeof PRECEDENCE> | number;
