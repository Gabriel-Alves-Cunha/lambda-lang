import type { TokenStream } from "@token-stream/index.js";
import type {
	Punctuation_Token,
	Operator_Token,
	Keyword_Token,
	Char,
} from "../@types/Tokens.js";
import type {
	VariableDefinition_AST,
	FunctionCall_AST,
	VariableName_AST,
	VariableName,
	Boolean_AST,
	Program_AST,
	Assign_AST,
	Binary_AST,
	Lambda_AST,
	Number_AST,
	Precedence,
	Let_AST,
	If_AST,
	AST,
} from "../@types/AST.js";

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

// const PRECEDENCE: Readonly<Record<Operator, number>> = Object.freeze(
// 	{
// 		"=": 1,
// 		"||": 2,
// 		"&&": 3,
// 		"!": 3,
// 		"<": 7,
// 		">": 7,
// 		"<=": 7,
// 		">=": 7,
// 		"==": 7,
// 		"!=": 7,
// 		"+": 10,
// 		"-": 10,
// 		"*": 20,
// 		"/": 20,
// 		"%": 20,
// 	} as const,
// );

export const PRECEDENCE = Object.freeze({
	"": 0, // Start of file?

	"=": 1, // Assignment
	"!": 2, // Logical NOT

	"*": 3, // Multiplication
	"/": 3, // Division
	"%": 3, // Remainder

	"+": 4, // Addition
	"-": 4, // Subtraction

	"<=": 6, // let
	">=": 6, // get
	"<": 6, // lt
	">": 6, // gt

	"==": 7, // Is equal
	"!=": 7, // Is not equal

	"&": 8, // Bitwise AND

	"|": 10, // Bitwise OR (inclusive or)

	"&&": 11, // Logical AND
	"||": 11, // Logical OR
} as const);

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
// Main function:

export function parse(input: TokenStream): AST {
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Assertions functions:

	function isNextCharThisPunctuation(char: Char): false | Punctuation_Token {
		const token = input.peek();

		if (
			token !== undefined &&
			token.type === punctuation &&
			(!char || token.value === char)
		)
			return token;

		return false;
	}

	/////////////////////////////////////////////////

	function isNextCharThisKeyword(keyword_: string): false | Keyword_Token {
		const token = input.peek();

		if (
			token !== undefined &&
			token.type === keyword &&
			(!keyword_ || token.value === keyword_)
		)
			return token;

		return false;
	}

	/////////////////////////////////////////////////

	function isNextCharAnOperator(operator_?: string): false | Operator_Token {
		const token = input.peek();

		if (
			token !== undefined &&
			token.type === operator &&
			(!operator_ || token.value === operator_)
		)
			return token;

		return false;
	}

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Skip functions:

	function skipThisPunctuation(punctuation_: Char): void {
		if (isNextCharThisPunctuation(punctuation_) !== false) input.next();
		else
			input.croak(
				`Expected punctuation \`${punctuation_}\`, got: \`${stringifyJson(
					input.peek()
				)}\`.`
			);
	}

	/////////////////////////////////////////////////

	function skipThisKeyword(keyword_: string): void {
		if (isNextCharThisKeyword(keyword_) !== false) input.next();
		else
			input.croak(
				`Expected keyword \`${keyword_}\`, got: \`${stringifyJson(
					input.peek()
				)}\`.`
			);
	}

	/////////////////////////////////////////////////

	// @ts-ignore => Will use it later:
	function skipOperator(operator_: string): void {
		if (isNextCharAnOperator(operator_) !== false) input.next();
		else
			input.croak(
				`Expected operator \`${operator_}\`, got: \`${stringifyJson(
					input.peek()
				)}\``
			);
	}

	/////////////////////////////////////////////////

	function unexpected(): never {
		input.croak(`Unexpected token: \`${stringifyJson(input.peek())}\``);
	}

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Delimiters functions:

	function delimited<T>(
		start: Char,
		stop: Char,
		separator: Char,
		parser: () => T
	): readonly T[] {
		const result: T[] = [];
		let first = true;

		skipThisPunctuation(start);

		while (!input.eof()) {
			if (isNextCharThisPunctuation(stop)) break;

			if (first) first = false;
			else skipThisPunctuation(separator);

			if (isNextCharThisPunctuation(stop)) break; // The last separator can be missing.

			result.push(parser());
		}

		skipThisPunctuation(stop);

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
	function maybeCall(parseCurrentExpression: () => AST): AST {
		// FunctionBody === AST;
		const functionCallASTOrFunctionBody = parseCurrentExpression();

		return isNextCharThisPunctuation("(")
			? parseFunctionCall(functionCallASTOrFunctionBody)
			: functionCallASTOrFunctionBody;
	}

	/////////////////////////////////////////////////

	function maybeBinary(
		left: AST,
		myPredecence: Precedence
	): Binary_AST | Assign_AST | AST {
		const token = isNextCharAnOperator();

		if (token !== false) {
			const leftPredecence = PRECEDENCE[token.value];

			if (leftPredecence > myPredecence) {
				input.next();

				const right = maybeBinary(parseAtom(), leftPredecence);
				const ast: Binary_AST | Assign_AST =
					token.value === "="
						? { type: assign, operator: token.value, right, left }
						: { type: binary, operator: token.value, right, left };

				return maybeBinary(ast, myPredecence);
			}
		}

		return left;
	}

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	/////////////////////////////////////////////////
	// Parse functions:

	function parseTopLevel(): Program_AST {
		const program_: AST[] = [];

		while (!input.eof()) {
			program_.push(parseExpression());

			if (!input.eof()) skipThisPunctuation(";"); // Using this, we demand semicolons between expressions.
		}

		const ast: Program_AST = { type: program, program: program_ };

		return ast;
	}

	/////////////////////////////////////////////////

	function parseVariableName(): VariableName_AST {
		const token = input.next();

		if (token?.type !== variableName)
			input.croak(
				`Expected a variable name, got: \`${stringifyJson(input)}\`.`
			);

		const ast: VariableName_AST = { type: variableName, name: token.value };

		return ast;
	}

	/////////////////////////////////////////////////

	function parseIf(): If_AST {
		skipThisKeyword("if");

		const condition = parseExpression();

		if (isNextCharThisPunctuation("{") === false) skipThisKeyword("then");

		const then = parseExpression();

		let else_: AST | undefined;
		if (isNextCharThisKeyword("else")) {
			input.next();
			else_ = parseExpression();
		}

		const result: If_AST = { type: if_, condition, then, else: else_ };

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
	function parseLet(): Let_AST | FunctionCall_AST {
		skipThisKeyword("let");

		if (input.peek()?.type === variableName) {
			const definitions = delimited("(", ")", ",", parseVariablesDefinitions);
			const variables: VariableName[] = definitions.map(def => ({
				name: def.name,
			}));
			const functionName = input.next()?.value as string | undefined;
			const body = parseExpression();

			const args = definitions.map(def => def.definition ?? FALSE);

			const ast: FunctionCall_AST = {
				fn: { type: lambda, functionName, variables, body },
				type: functionCall,
				args,
			};

			return ast;
		}

		const ast: Let_AST = {
			variables: delimited("(", ")", ",", parseVariablesDefinitions),
			body: parseExpression(),
			type: let_,
		};

		return ast;
	}

	/////////////////////////////////////////////////

	function parseVariablesDefinitions(): VariableDefinition_AST {
		const { name } = parseVariableName();
		let definition: AST | undefined;

		if (isNextCharAnOperator("=")) {
			input.next();
			definition = parseExpression();
		}

		const ast: VariableDefinition_AST = {
			type: variableDefinition,
			definition,
			name,
		};

		return ast;
	}

	/////////////////////////////////////////////////

	function parseProgram(): AST {
		const program_ = delimited("{", "}", ";", parseExpression);

		if (program_.length === 0) return FALSE;
		if (program_.length === 1) return program_[0] as AST;

		const ast: Program_AST = { type: program, program: program_ };

		return ast;
	}

	/////////////////////////////////////////////////

	function parseLambda(): Lambda_AST {
		const functionName =
			input.peek()?.type === variableName
				? (input.next()?.value as string | undefined)
				: undefined;

		const ast: Lambda_AST = {
			variables: delimited("(", ")", ",", parseVariableName),
			body: parseExpression(),
			type: lambda,
			functionName,
		};

		return ast;
	}

	/////////////////////////////////////////////////

	function parseFunctionCall(fn: AST): FunctionCall_AST {
		const ast: FunctionCall_AST = {
			args: delimited("(", ")", ",", parseExpression),
			type: functionCall,
			fn,
		};

		return ast;
	}

	/////////////////////////////////////////////////

	function parseBoolean(): Boolean_AST {
		const ast: Boolean_AST = {
			value: input.next()?.value === "true",
			type: boolean,
		};

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
			if (isNextCharThisPunctuation("(")) {
				input.next();
				const expression = parseExpression();
				skipThisPunctuation(")");

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

			if (isNextCharThisPunctuation("{")) return parseProgram();
			if (isNextCharThisKeyword("let")) return parseLet();
			if (isNextCharThisKeyword("if")) return parseIf();
			if (isNextCharThisKeyword("true") || isNextCharThisKeyword("false"))
				return parseBoolean();
			if (isNextCharThisKeyword("lambda") || isNextCharThisKeyword("λ")) {
				input.next();
				return parseLambda();
			}

			const token = input.next();

			if (token !== undefined) {
				if (token.type === variableName || token.type === string) {
					const ast: VariableName_AST = {
						type: variableName,
						name: token.value,
					};

					return ast;
				}

				if (token.type === number) {
					const ast: Number_AST = { type: number, value: token.value };

					return ast;
				}
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
// Constants:

export const variableDefinition = "VariableDefinition";
export const functionCall = "FunctionCall";
export const boolean = "Boolean";
export const program = "Program";
export const lambda = "Lambda";
export const binary = "Binary";
export const assign = "Assign";
export const let_ = "Let";
export const if_ = "If";

export const FALSE: Boolean_AST = Object.freeze({
	type: boolean,
	value: false,
} as const);

export const TRUE: Boolean_AST = Object.freeze({
	type: boolean,
	value: true,
} as const);
