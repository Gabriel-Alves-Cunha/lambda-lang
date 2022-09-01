import type { Operator, Char } from "../@types/Tokens.js";
import type { TokenStream } from "@token-stream/index.js";
import type { ValueOf } from "../@types/General.js";

import { stringifyJson } from "@utils/utils.js";
import {
	variableName,
	punctuation,
	operator,
	keyword,
	number,
	string,
} from "@utils/token-types.js";

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
// Constants:

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

	function isPunctuation(char: Char) {
		const token = input.peek();

		// TODO
		return token &&
				token.type === punctuation &&
				(!char || token.value === char) &&
				token ?
			token :
			false;
		// return token !== undefined &&
		// 	token.type === punctuation &&
		// 	(char.length === 0 || token.value === char)
		// 	? token
		// 	: false;
	}

	/////////////////////////////////////////////////

	function isKeyword(keyword_: string) {
		const token = input.peek();

		// TODO
		return token &&
				token.type === keyword &&
				(!keyword_ || token.value === keyword_) &&
				token ?
			token :
			false;
	}

	/////////////////////////////////////////////////

	function isOperator(operator_?: string) {
		const token = input.peek();

		return token &&
				token.type === operator &&
				(!operator_ || token.value === operator_) ?
			token :
			false;
	}

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Skip functions:

	function skipPunctuation(char: Char): void {
		if (isPunctuation(char)) input.next();
		else input.croak(`Expected punctuation \`${char}\`.`);
	}

	/////////////////////////////////////////////////

	function skipKeyword(keyword_: string): void {
		if (isKeyword(keyword_)) input.next();
		else input.croak(`Expected keyword \`${keyword_}\`.`);
	}

	/////////////////////////////////////////////////

	// @ts-ignore => Will use it later:
	function skipOperator(operator_: string): void {
		if (isOperator(operator_)) input.next();
		else input.croak(`Expected operator \`${operator_}\`.`);
	}

	/////////////////////////////////////////////////

	function unexpected(): never {
		input.croak(`Unexpected token: ${stringifyJson(input.peek())}`);
	}

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Delimiters functions:

	function delimited<T>(
		start: Char,
		stop: Char,
		separator: Char,
		parser: () => T,
	): readonly T[] {
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
	}

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
	function maybeCall(parseCurrentExpression: () => AST) {
		// FunctionBody === AST;
		const functionCallASTOrFunctionBody = parseCurrentExpression();

		return isPunctuation("(") ?
			parseFunctionCall(functionCallASTOrFunctionBody) :
			functionCallASTOrFunctionBody;
	}

	/////////////////////////////////////////////////

	function maybeBinary(
		left: AST,
		myPredecence: Precedence,
	):
		| Readonly<{ type: typeof binary; } & Binary>
		| Readonly<{ type: typeof assign; } & Assign>
		| AST {
		const token = isOperator();

		if (token !== false) {
			const leftPredecence = PRECEDENCE[token.value];

			if (leftPredecence > myPredecence) {
				input.next();

				const right = maybeBinary(parseAtom(), leftPredecence);
				const ast: AST = token.value === "=" ?
					{ type: assign, operator: token.value, right, left } :
					{ type: binary, operator: token.value, right, left };

				return maybeBinary(ast, myPredecence);
			}
		}

		return left;
	}

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Parse functions:

	function parseTopLevel() {
		const program_: AST[] = [];

		while (!input.eof()) {
			program_.push(parseExpression());

			if (!input.eof()) skipPunctuation(";"); // Using this, we demand semicolons between expressions.
		}

		const ast: AST = { type: program, program: program_ };

		return ast;
	}

	/////////////////////////////////////////////////

	function parseVariableName() {
		const name = input.next();

		if (name?.type !== variableName)
			input.croak(
				`Expected input of type \`${variableName}\`, got = ${
					stringifyJson(input)
				}.`,
			);

		return name;
	}

	/////////////////////////////////////////////////

	function parseIf() {
		skipKeyword("if");

		const condition = parseExpression();

		if (isPunctuation("{") === false) skipKeyword("then");

		const then = parseExpression();

		let else_: AST | undefined;
		if (isKeyword("else")) {
			input.next();
			else_ = parseExpression();
		}

		const result: AST = { type: if_, condition, then, else: else_ };

		return result;
	}

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
	function parseLet() {
		skipKeyword("let");

		if (input.peek()?.type === variableName) {
			const functionName = input.next()?.value as string | undefined;
			const definitions = delimited("(", ")", ",", parseVariablesDefinitions);
			const variables: VariableName[] = definitions.map(def => ({
				value: def.name,
			}));

			const ast: AST = {
				type: functionCall,
				fn: { type: lambda, functionName, variables, body: parseExpression() },
				args: definitions.map(def => def.definition ?? FALSE),
			};

			return ast;
		}

		const ast: AST = {
			type: let_,
			variables: delimited("(", ")", ",", parseVariablesDefinitions),
			body: parseExpression(),
		};

		return ast;
	}

	/////////////////////////////////////////////////

	function parseVariablesDefinitions() {
		const { value: name } = parseVariableName();
		let definition: AST | undefined;

		if (isOperator("=")) {
			input.next();
			definition = parseExpression();
		}

		const ast: AST = { type: variableDefinition, name, definition };

		return ast;
	}

	/////////////////////////////////////////////////

	function parseProgram() {
		const program_ = delimited("{", "}", ";", parseExpression);

		if (program_.length === 0) return FALSE;
		if (program_.length === 1) return program_[0] as AST;

		const ast: AST = { type: program, program: program_ };

		return ast;
	}

	/////////////////////////////////////////////////

	function parseLambda() {
		const ast: AST = {
			type: lambda,
			functionName: input.peek()?.type === variableName ?
				(input.next()?.value as string | undefined) :
				undefined,
			variables: delimited("(", ")", ",", parseVariableName),
			body: parseExpression(),
		};

		return ast;
	}

	/////////////////////////////////////////////////

	function parseFunctionCall(fn: AST) {
		const ast: AST = {
			args: delimited("(", ")", ",", parseExpression),
			type: functionCall,
			fn,
		};

		return ast;
	}

	/////////////////////////////////////////////////

	function parseBoolean() {
		const ast: AST = { type: boolean, value: input.next()?.value === "true" };

		return ast;
	}

	/////////////////////////////////////////////////

	function parseExpression(): AST {
		return maybeCall(() => maybeBinary(parseAtom(), 0));
	}
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
	function parseAtom() {
		return maybeCall((): AST => {
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

			if (token !== undefined) {
				if (token.type === variableName || token.type === string) return token;
				if (token.type === number) return token;
			}

			unexpected();
		});
	}
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
	| ({ type: typeof variableDefinition; } & VariableDefinition)
	| ({ type: typeof functionCall; } & FunctionCall)
	| ({ type: typeof variableName; } & VariableName)
	| ({ type: typeof boolean; } & Boolean)
	| ({ type: typeof program; } & Program)
	| ({ type: typeof lambda; } & Lambda)
	| ({ type: typeof binary; } & Binary)
	| ({ type: typeof assign; } & Assign)
	| ({ type: typeof number; } & Number)
	| ({ type: typeof string; } & String)
	| ({ type: typeof let_; } & Let)
	| ({ type: typeof if_; } & If)
>;

export type Lambda = {
	functionName: string | undefined;
	variables: readonly VariableName[];
	body: AST;
};
export type VariableDefinition = { definition: AST | undefined; name: string; };
export type Let = { variables: readonly VariableDefinition[]; body: AST; };
export type If = { condition: AST; then: AST; else: AST | undefined; };
export type Binary = { operator: Operator; left: AST; right: AST; };
export type Assign = { operator: "="; left: AST; right: AST; };
export type FunctionCall = { args: readonly AST[]; fn: AST; };
export type Program = { program: readonly AST[]; };
export type Boolean = { value: true | false; };
export type VariableName = { value: string; };
export type Number = { value: number; };
export type String = { value: string; };

/////////////////////////////////////////////////

export const variableDefinition = "VariableDefinition";
export const functionCall = "FunctionCall";
export const boolean = "Boolean";
export const program = "Program";
export const lambda = "Lambda";
export const binary = "Binary";
export const assign = "Assign";
export const let_ = "Let";
export const if_ = "If";

const FALSE: AST = Object.freeze({ type: boolean, value: false } as const);

/////////////////////////////////////////////////

// TODO:
type Precedence = ValueOf<typeof PRECEDENCE> | number;
