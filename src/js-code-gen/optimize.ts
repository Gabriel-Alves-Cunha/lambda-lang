import type { Mutable } from "src/@types/General.js";
import type {
	FunctionCall_AST,
	Boolean_AST,
	Program_AST,
	Assign_AST,
	Binary_AST,
	Lambda_AST,
	Number_AST,
	If_AST,
	AST,
} from "../@types/AST.js";

import { number, string, variableName } from "@utils/token-types.js";
import { generateSymbol } from "./generateSymbol.js";
import { hasSideEffects } from "./hasSideEffects.js";
import { stringifyJson } from "@utils/utils.js";
import { makeScope } from "./makeScope.js";
import {
	variableDefinition,
	functionCall,
	boolean,
	program,
	assign,
	binary,
	lambda,
	FALSE,
	TRUE,
	if_,
} from "@parser/index.js";

export function optimize(expression: AST): AST {
	let changes = 0,
		defun: AST | undefined;

	do {
		changes = 0;

		makeScope(expression);

		expression = opt(expression);
	} while (changes > 0);

	makeScope(expression);

	return expression;

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////

	function opt(expression: AST): AST {
		if (changes > 0) return expression;

		switch (expression.type) {
			case variableDefinition:
			case variableName:
			case boolean:
			case number:
			case string:
				return expression;

			case binary:
				return optimize_binary(expression);

			case assign:
				return optimize_assign(expression);

			case if_:
				return optimize_if(expression);

			case program:
				return optimize_program(expression);

			case functionCall:
				return optimize_functionCall(expression);

			case lambda:
				return optimize_lambda(expression);

			default:
				break;
		}

		throw new Error(
			`I don't know how to optimize \`${stringifyJson(expression)}\`!`
		);
	}

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////

	function changed(): void {
		++changes;
	}

	/////////////////////////////////////////////////

	function isConstant(expression: AST): boolean {
		return (
			expression.type === number ||
			expression.type === string ||
			expression.type === boolean
		);
	}

	/////////////////////////////////////////////////

	function getNumber(expression: AST): number {
		if (!isNumber(expression))
			throw new Error(
				`Expected a number, got: \`${stringifyJson(expression)}\``
			);

		return expression.value;
	}

	/////////////////////////////////////////////////

	function div(expression: Number_AST): number {
		if (getNumber(expression) === 0)
			throw new Error(`Division by zero: \`${stringifyJson(expression)}\``);

		return expression.value;
	}

	/////////////////////////////////////////////////

	function optimize_binary(expression: Mutable<Binary_AST>): AST {
		expression.right = opt(expression.right);
		expression.left = opt(expression.left);

		if (isConstant(expression.left) && isConstant(expression.right)) {
			switch (expression.operator) {
				case "+": {
					changed();
					const ast: Number_AST = {
						value: getNumber(expression.left) + getNumber(expression.right),
						type: number,
					};
					return ast;
				}

				case "-": {
					changed();
					const ast: Number_AST = {
						value: getNumber(expression.left) - getNumber(expression.right),
						type: number,
					};
					return ast;
				}

				case "*": {
					changed();
					const ast: Number_AST = {
						value: getNumber(expression.left) * getNumber(expression.right),
						type: number,
					};
					return ast;
				}

				case "/": {
					changed();
					const ast: Number_AST = {
						value: getNumber(expression.left) / getNumber(expression.right),
						type: number,
					};
					return ast;
				}

				case "%": {
					changed();
					const ast: Number_AST = {
						value: getNumber(expression.left) % getNumber(expression.right),
						type: number,
					};
					return ast;
				}

				case "<": {
					changed();
					const ast: Boolean_AST = {
						value: getNumber(expression.left) < getNumber(expression.right),
						type: boolean,
					};
					return ast;
				}

				case ">": {
					changed();
					const ast: Boolean_AST = {
						value: getNumber(expression.left) > getNumber(expression.right),
						type: boolean,
					};
					return ast;
				}

				case "<=": {
					changed();
					const ast: Boolean_AST = {
						value: getNumber(expression.left) <= getNumber(expression.right),
						type: boolean,
					};
					return ast;
				}

				case ">=": {
					changed();
					const ast: Boolean_AST = {
						value: getNumber(expression.left) >= getNumber(expression.right),
						type: boolean,
					};
					return ast;
				}

				case "==": {
					changed();

					if (expression.left.type !== expression.right.type) return FALSE;

					const ast: Boolean_AST = {
						value: getNumber(expression.left) === getNumber(expression.right),
						type: boolean,
					};

					return ast;
				}

				case "!=": {
					changed();

					if (expression.left.type !== expression.right.type) return TRUE;

					const ast: Boolean_AST = {
						value: getNumber(expression.left) !== getNumber(expression.right),
						type: boolean,
					};

					return ast;
				}

				case "||": {
					changed();

					if (!isBooleanAST(expression.left))
						throw new Error(
							`Expected a boolean expression, got \`${stringifyJson(
								expression
							)}\``
						);

					if (expression.left.value !== false) return expression.left;

					return expression.right;
				}

				case "&&": {
					changed();

					if (!isBooleanAST(expression.left))
						throw new Error(
							`Expected a boolean expression, got \`${stringifyJson(
								expression
							)}\``
						);

					if (expression.left.value !== false) return expression.right;

					return FALSE;
				}
			}
		}

		return expression;
	}

	/////////////////////////////////////////////////

	function optimize_assign(expression: Mutable<Assign_AST>): AST {
		if (expression.left.type === variableDefinition) {
			if (
				expression.right.type === variableDefinition &&
				expression.right.definition?.isThisAContinuationArgument === true
			) {
				// the var on the right never changes.  we can safely
				// replace references to exp.left with references to
				// exp.right, saving one var and the assignment.
				changed();

				expression.left.definition?.refs.forEach(function (node) {
					node.value = expression.right.value;
				});

				return opt(expression.right); // could be needed for the result.
			}

			if (
				expression.left.definition?.refs.length ===
					expression.left.definition?.assigned &&
				expression.left.env.parent !== null
			) {
				// if assigned as many times as referenced and not a
				// global, it means the var is never used, drop the
				// assignment but keep the right side for possible
				// side effects.
				changed();

				return opt(expression.right);
			}
		}

		expression.right = opt(expression.right);
		expression.left = opt(expression.left);

		return expression;
	}

	/////////////////////////////////////////////////

	function optimize_if(expression: Mutable<If_AST>): AST {
		expression.condition = opt(expression.condition);
		expression.else = opt(expression.else ?? FALSE);
		expression.then = opt(expression.then);

		if (isConstant(expression.condition)) {
			changed();

			if (expression.condition.value !== false) return expression.then;

			return expression.else;
		}

		return expression;
	}

	/////////////////////////////////////////////////

	function optimize_program(expression: Program_AST): AST {
		if (expression.program.length === 0) {
			changed();
			return FALSE;
		}

		if (expression.program.length === 1) {
			changed();

			return opt(expression.program[0]!);
		}

		if (!hasSideEffects(expression.program[0]!)) {
			changed();

			return opt({
				program: expression.program.slice(1),
				type: program,
			});
		}

		if (expression.program.length === 2)
			return {
				program: expression.program.map(opt),
				type: program,
			};

		// normalize
		return opt({
			type: program,
			program: [
				{ type: program, program: expression.program.slice(1) },
				expression.program[0]!,
			],
		});
	}

	/////////////////////////////////////////////////

	function optimize_functionCall(
		expression: Mutable<FunctionCall_AST>
	): FunctionCall_AST {
		// IIFE-s will be optimized away by defining variables in the
		// containing function.  However, we don't unwrap into the
		// global scope (that's why checking for env.parent.parent).
		const fn = expression.fn;

		if (fn.type === lambda && fn.functionName === undefined) {
			if (fn.env.parent.parent !== null) return optimize_iife(expression);

			// however, if in global scope we can safely unguard it.
			fn.unguarded = true;
		}

		const ast: FunctionCall_AST = {
			args: expression.args.map(opt),
			type: functionCall,
			fn: opt(fn),
		};

		return ast;
	}

	/////////////////////////////////////////////////

	function optimize_lambda(expression: Mutable<Lambda_AST>): AST {
		// λ(x...) y(x...)  ==>  y
		TCO: if (
			expression.body.type === functionCall &&
			expression.body.fn.type === variableDefinition &&
			expression.body.fn.definition?.assigned === 0 &&
			expression.body.fn.env.parent !== null &&
			expression.variables.indexOf(expression.body.fn.value) === -1 &&
			expression.variables.length === expression.body.args.length
		) {
			for (let i = 0; i < expression.variables.length; ++i) {
				const x = expression.body.args[i]!;

				if (
					x.type !== variableDefinition ||
					x.name !== expression.variables[i]!.name
				)
					break TCO;
			}

			changed();

			return opt(expression.body.fn);
		}

		expression.locals = expression.locals.filter(function (name) {
			const def = expression.env.get(name);

			return def.refs.length > 0;
		});

		const save = defun;
		defun = expression;

		expression.body = opt(expression.body);

		if (expression.body.type === functionCall) expression.unguarded = true;

		return expression;
	}

	/////////////////////////////////////////////////

	// (λ(foo, bar){...body...})(fooval, barval)
	//    ==>
	// foo = fooval, bar = barval, ...body...
	function optimize_iife(expression: FunctionCall_AST): AST {
		changed();

		const fn = expression.fn;
		const argValues = expression.args.map(opt);
		const body = opt(fn.body);

		function rename(name: string): string {
			const sym =
				name in defun?.env.variables ? generateSymbol(name + "$") : name;

			defun.locals.push(sym);
			defun.env.define(sym, true);

			fn.env.get(name).refs.forEach(function (ref) {
				ref.value = sym;
			});

			return sym;
		}

		const program_ = fn.variables.map(function (name, index) {
			const ast: Assign_AST = {
				left: { type: variableName, name: rename(name.name) },
				right: argValues[index] ?? FALSE,
				operator: "=",
				type: assign,
			};

			return ast;
		});

		fn.locals.forEach(rename);
		program_.push(body);

		const ast: Program_AST = {
			program: program_,
			type: program,
		};

		return ast;
	}
}

/////////////////////////////////////////////////

function isNumber(expression: AST): expression is Number_AST {
	return expression.type === number;
}

/////////////////////////////////////////////////

function isBooleanAST(expression: AST): expression is Boolean_AST {
	return expression.type === boolean;
}
