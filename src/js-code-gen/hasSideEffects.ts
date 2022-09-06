import type { AST } from "../@types/AST.js";

import { number, string, variableName } from "@utils/token-types.js";
import {
	variableDefinition,
	functionCall,
	boolean,
	program,
	assign,
	binary,
	lambda,
	let_,
	if_,
} from "@parser/index.js";

export function hasSideEffects(expression: AST): boolean {
	switch (expression.type) {
		case functionCall:
		case assign:
			return true;

		case variableDefinition:
		case variableName:
		case boolean:
		case number:
		case string:
		case lambda:
			return false;

		case binary:
			return (
				hasSideEffects(expression.left) || hasSideEffects(expression.right)
			);

		case if_:
			return (
				hasSideEffects(expression.condition) ||
				hasSideEffects(expression.then) ||
				(expression.else !== undefined && hasSideEffects(expression.else))
			);

		case let_: {
			for (let i = 0; i < expression.variables.length; ++i) {
				const v = expression.variables[i]!;
				if (v.definition !== undefined && hasSideEffects(v.definition))
					return true;
			}

			return hasSideEffects(expression.body);
		}

		case program: {
			for (let i = 0; i < expression.program.length; ++i)
				if (hasSideEffects(expression.program[i]!)) return true;

			return false;
		}

		default:
			break;
	}

	return true;
}
