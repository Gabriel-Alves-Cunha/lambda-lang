import { Char, Operator, ValueOf } from "../@types/general-types";
import { dbg, stringifyJson } from "../utils/utils";
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
		"!": 3,
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

// const PRECEDENCE: Readonly<Record<Operator, number>> = Object.freeze(
// 	{
// 		"!": 2, // Logical NOT
//
// 		"*": 3, // Multiplication
// 		"/": 3, // Division
// 		"%": 3, // Remainder
//
// 		"+": 4, // Addition
// 		"-": 4, // Subtraction
//
// 		"<": 6, // lt
// 		"<=": 6, // let
// 		">": 6, // gt
// 		">=": 6, // get
//
// 		"==": 7, // Is equal
// 		"!=": 7, // Is not equal
//
// 		"|": 10, // Bitwise OR (inclusive or)
//
// 		"&&": 11, // Logical AND
// 		"||": 11, // Logical OR
//
// 		"=": 1, // Assignment
// 	} as const,
// );

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
		input.croak(`Unexpected token: ${stringifyJson(input.peek())}`);

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Delimiters functions:

	const delimited = <T>(
		start: Char,
		stop: Char,
		separator: Char,
		parser: () => T,
	): readonly T[] => {
		const result: T[] = [];
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

	/** These functions check what follows after an
	 * expression in order to decide whether to wrap
	 * that expression in another node, or just
	 * return it as is.
	 *
	 * maybe_call() is very simple. It receives a
	 * function that is expected to parse the current
	 * expression. If after that expression it sees a
	 * `(` punctuation token, then it must be a "call"
	 * node, which is what parse_call() makes
	 * (included below). Notice again how delimited()
	 * comes in handy for reading the argument list.
	 */
	const maybeCall = (parseCurrentExpression: () => AST) => {
		// FunctionBody == AST;
		const functionCallASTOrFunctionBody = parseCurrentExpression();

		return isPunctuation("(") ?
			parseFunctionCall(functionCallASTOrFunctionBody) :
			functionCallASTOrFunctionBody;
	};

	/////////////////////////////////////////////////

	const maybeBinary = (
		left: AST,
		myPredecence: Precedence,
	):
		| Readonly<{ type: "Binary"; } & Binary>
		| Readonly<{ type: "Assign"; } & Assign>
		| AST => {
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

	const parseTopLevel = () => {
		const program: AST[] = [];

		while (!input.eof()) {
			dbg("program =", stringifyJson(program));

			program.push(parseExpression());

			if (!input.eof()) skipPunctuation(";"); // Using this, we demand semicolons between expressions.
		}

		const ast: AST = { type: "Program", program };

		return ast;
	};

	/////////////////////////////////////////////////

	const parseVariableName = () => {
		const name = input.next();

		if (name?.type !== "VariableName")
			input.croak(
				`Expected input of type "Variable name", got input = ${
					stringifyJson(input)
				}.`,
			);

		return name;
	};

	/////////////////////////////////////////////////

	const parseIf = () => {
		skipKeyword("if");

		const condition = parseExpression();

		if (!isPunctuation("{")) skipKeyword("then");

		const then = parseExpression();

		let else_: AST | undefined;
		if (isKeyword("else")) {
			input.next();
			else_ = parseExpression();
		}

		const result: AST = { type: "If", condition, then, else: else_ };

		return result;
	};

	/////////////////////////////////////////////////

	/** If following the let we have a "var" token, then
	 * it's a named let. We read the definitions with delimited,
	 * as they're in parens and separated by commas, and use a
	 * parse_vardef helper which is defined below. Then we return
	 * a "call" node which calls a named function expression
	 * (so the whole result node is an IIFE). The function's
	 * argument names are the variables defined in let, and the
	 * "call" will take care to send the values in args. And
	 * the body of the function is, of course, fetched with
	 * parse_expression().
	 */
	const parseLet = () => {
		skipKeyword("let");

		if (input.peek()?.type === "VariableName") {
			const functionName = input.next()?.value as string | undefined;
			const definitions = delimited("(", ")", ",", parseVariablesDefinitions);
			const variables: VariableName[] = definitions.map(def => ({
				value: def.name,
			}));

			const ast: AST = {
				type: "FunctionCall",
				fn: {
					type: "Lambda",
					functionName,
					variables,
					body: parseExpression(),
				},
				args: definitions.map(def => def.definition ?? FALSE),
			};

			return ast;
		}

		const ast: AST = {
			type: "Let",
			variables: delimited("(", ")", ",", parseVariablesDefinitions),
			body: parseExpression(),
		};

		return ast;
	};

	/////////////////////////////////////////////////

	const parseVariablesDefinitions = () => {
		const { value: name } = parseVariableName();
		let definition: AST | undefined;

		if (isOperator("=")) {
			input.next();
			definition = parseExpression();
		}

		const ast: AST = { type: "VariableDefinition", name, definition };

		return ast;
	};

	/////////////////////////////////////////////////

	const parseProgram = () => {
		const program = delimited("{", "}", ";", parseExpression);

		if (program.length === 0) return FALSE;
		if (program.length === 1) return program[0] as AST;

		const ast: AST = { type: "Program", program };

		return ast;
	};

	/////////////////////////////////////////////////

	const parseLambda = () => {
		const ast: AST = {
			type: "Lambda",
			functionName: input.peek()?.type === "VariableName" ?
				input.next()?.value as string | undefined :
				undefined,
			variables: delimited("(", ")", ",", parseVariableName),
			body: parseExpression(),
		};

		return ast;
	};

	/////////////////////////////////////////////////

	const parseFunctionCall = (fn: AST) => {
		const ast: AST = {
			args: delimited("(", ")", ",", parseExpression),
			type: "FunctionCall",
			fn,
		};

		return ast;
	};

	/////////////////////////////////////////////////

	const parseBoolean = () => {
		const ast: AST = { type: "Boolean", value: input.next()?.value === "true" };

		return ast;
	};

	/////////////////////////////////////////////////

	const parseExpression = (): AST =>
		maybeCall(() => maybeBinary(parseAtom(), 0));

	/////////////////////////////////////////////////

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
	const parseAtom = () =>
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
			if (isKeyword("let")) return parseLet();
			if (isKeyword("if")) return parseIf();
			if (isKeyword("true") || isKeyword("false")) return parseBoolean();
			if (isKeyword("lambda") || isKeyword("λ")) {
				input.next();
				return parseLambda();
			}

			const token = input.next();

			if (token) {
				if (token.type === "VariableName" || token.type === "String")
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
	| ({ type: "VariableDefinition"; } & VariableDefinition)
	| ({ type: "FunctionCall"; } & FunctionCall)
	| ({ type: "VariableName"; } & VariableName)
	| ({ type: "Boolean"; } & Boolean)
	| ({ type: "Program"; } & Program)
	| ({ type: "Lambda"; } & Lambda)
	| ({ type: "Lambda"; } & Lambda)
	| ({ type: "Binary"; } & Binary)
	| ({ type: "Assign"; } & Assign)
	| ({ type: "Number"; } & Number)
	| ({ type: "String"; } & String)
	| ({ type: "Let"; } & Let)
	| ({ type: "If"; } & If)
>;

type Lambda = {
	functionName: string | undefined;
	variables: readonly VariableName[];
	body: AST;
};
type VariableDefinition = { definition: AST | undefined; name: string; };
type Let = { variables: readonly VariableDefinition[]; body: AST; };
type If = { condition: AST; then: AST; else: AST | undefined; };
type Binary = { operator: Operator; left: AST; right: AST; };
type Assign = { operator: "="; left: AST; right: AST; };
type FunctionCall = { args: readonly AST[]; fn: AST; };
type Program = { program: readonly AST[]; };
type Boolean = { value: true | false; };
type VariableName = { value: string; };
type Number = { value: number; };
type String = { value: string; };

/////////////////////////////////////////////////

type Precedence = ValueOf<typeof PRECEDENCE> | number;
