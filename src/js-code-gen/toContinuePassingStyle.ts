import type {
	VariableDefinition_AST,
	VariableName_AST,
	FunctionCall_AST,
	Boolean_AST,
	Program_AST,
	Assign_AST,
	Binary_AST,
	Lambda_AST,
	Number_AST,
	String_AST,
	Let_AST,
	If_AST,
	AST,
} from "../@types/AST.js";

import { number, string, variableName } from "@utils/token-types.js";
import { generateSymbol } from "./generateSymbol.js";
import { hasSideEffects } from "./hasSideEffects.js";
import { stringifyJson } from "@utils/utils.js";
import {
	variableDefinition,
	functionCall,
	boolean,
	program,
	assign,
	binary,
	lambda,
	FALSE,
	let_,
	if_,
} from "@parser/index.js";

export function toContinuePassingStyle(
	expression: AST,
	continuationCallback: (expression: AST) => AST
): AST {
	return continuePassingStyle(expression, continuationCallback);

	function continuePassingStyle(
		expression: AST,
		continuationCallback: (expression: AST) => AST
	) {
		switch (expression.type) {
			case variableDefinition:
			case variableName:
			case boolean:
			case number:
			case string:
				return continuePassingStyleAtom(expression, continuationCallback);

			case program:
				return continuePassingStyle_Program(expression, continuationCallback);
			case assign:

			case binary:
				return continuePassingStyleBinary(expression, continuationCallback);

			case lambda:
				return continuePassingStyleLambda(expression, continuationCallback);

			case let_:
				return continuePassingStyleLet(expression, continuationCallback);

			case if_:
				return continuePassingStyle_If(expression, continuationCallback);

			case functionCall:
				return continuePassingStyle_FunctionCall(
					expression,
					continuationCallback
				);

			default: {
				throw new Error(
					`Dunno how to continuePassingStyle for \`${stringifyJson(
						expression
					)}\`!`
				);
			}
		}
	}

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////

	function continuePassingStyleAtom(
		expression: Atom_AST,
		continuationCallback: (expression: AST) => AST
	): AST {
		return continuationCallback(expression);
	}

	/////////////////////////////////////////////////

	function continuePassingStyleBinary(
		expression: Binary_AST | Assign_AST,
		continuationCallback: (expression: AST) => AST
	): AST {
		return continuePassingStyle(expression.left, function (left: AST): AST {
			return continuePassingStyle(expression.right, function (right: AST): AST {
				const ast: Binary_AST | Assign_AST = {
					operator: expression.operator,
					type: expression.type,
					right,
					left,
				};

				return continuationCallback(ast);
			});
		});
	}

	/////////////////////////////////////////////////

	function continuePassingStyleLet(
		expression: Let_AST,
		continuationCallback: (expression: AST) => AST
	): AST {
		if (expression.variables.length === 0)
			return continuePassingStyle(expression.body, continuationCallback);

		const args: AST[] = [expression.variables[0]!.definition ?? FALSE];

		const fn: Lambda_AST = {
			variables: [{ name: expression.variables[0]!.name }],
			functionName: undefined,
			type: lambda,
			body: {
				variables: expression.variables.slice(1),
				body: expression.body,
				type: let_,
			},
		};

		return continuePassingStyle(
			{
				type: functionCall,
				args,
				fn,
			},
			continuationCallback
		);
	}

	/////////////////////////////////////////////////

	function continuePassingStyleLambda(
		expression: Lambda_AST,
		continuationCallback: (expression: AST) => AST
	): AST {
		const continuationName: VariableName_AST = {
			name: generateSymbol("K"),
			type: variableName,
		};
		const body = continuePassingStyle(expression.body, (body: AST): AST => {
			const ast: FunctionCall_AST = {
				fn: continuationName,
				type: functionCall,
				args: [body],
			};

			return ast;
		});

		return continuationCallback({
			variables: [continuationName, ...expression.variables],
			functionName: expression.functionName,
			type: lambda,
			body,
		});
	}

	/////////////////////////////////////////////////

	function continuePassingStyle_If(
		expression: If_AST,
		continuationCallback: (expression: AST) => AST
	): AST {
		return continuePassingStyle(
			expression.condition,
			function (condition: AST): AST {
				const continuationAST = makeContinuation(continuationCallback);
				const continuationVariable: VariableName_AST = {
					name: generateSymbol("IF"),
					type: variableName,
				};

				continuationCallback = function (if_result: AST): FunctionCall_AST {
					const ast: FunctionCall_AST = {
						fn: continuationVariable,
						type: functionCall,
						args: [if_result],
					};

					return ast;
				};

				const ifAST: If_AST = {
					then: continuePassingStyle(expression.then, continuationCallback),
					else: continuePassingStyle(
						expression.else ?? FALSE,
						continuationCallback
					),
					type: if_,
					condition,
				};
				const fn: Lambda_AST = {
					variables: [continuationVariable],
					functionName: undefined,
					type: lambda,
					body: ifAST,
				};
				const ast: FunctionCall_AST = {
					args: [continuationAST],
					type: functionCall,
					fn,
				};

				return ast;
			}
		);
	}

	/////////////////////////////////////////////////

	function continuePassingStyle_FunctionCall(
		expression: FunctionCall_AST,
		continuationCallback: (expression: AST) => AST
	): AST {
		return continuePassingStyle(expression.fn, function (fn: AST): AST {
			return (function loop(args, index: number): AST {
				if (index === expression.args.length) {
					const ast: FunctionCall_AST = {
						type: functionCall,
						args,
						fn,
					};

					return ast;
				}

				return continuePassingStyle(
					expression.args[index]!,
					(value: AST): AST => {
						args[index + 1] = value as Lambda_AST;
						return loop(args, index + 1);
					}
				);
			})([makeContinuation(continuationCallback)], 0);
		});
	}

	/////////////////////////////////////////////////

	function continuePassingStyle_Program(
		expression: Program_AST,
		continuationCallback: (expression: AST) => AST
	): AST {
		return (function loop(body: readonly AST[]): AST {
			if (body.length === 0) return FALSE;
			if (body.length === 1)
				return continuePassingStyle(body[0]!, continuationCallback);

			if (!hasSideEffects(body[0]!)) return loop(body.slice(1));

			return continuePassingStyle(body[0]!, function (first: AST): AST {
				const ast: Program_AST = {
					program: [first, loop(body.slice(1))],
					type: program,
				};

				if (hasSideEffects(first)) return ast;

				return loop(body.slice(1));
			});
		})(expression.program);
	}
}

/////////////////////////////////////////////////

function makeContinuation(continuation: (expression: AST) => AST): Lambda_AST {
	const continuationName: VariableName_AST = {
		name: generateSymbol("R"),
		type: variableName,
	};

	const ast: Lambda_AST = {
		body: continuation(continuationName),
		variables: [continuationName],
		functionName: undefined,
		type: lambda,
	};

	return ast;
}

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
// Types:

type Atom_AST =
	| VariableDefinition_AST
	| VariableName_AST
	| Boolean_AST
	| Number_AST
	| String_AST;
