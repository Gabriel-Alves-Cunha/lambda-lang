import type { Mutable } from "src/@types/General.js";
import type { AST } from "../@types/AST.js";

import { type Enviroment, makeEnviroment } from "@enviroment/index.js";
import { number, string, variableName } from "@utils/token-types.js";
import { stringifyJson } from "@utils/utils.js";
import {
	variableDefinition,
	functionCall,
	boolean,
	program,
	assign,
	lambda,
	if_,
} from "@parser/index.js";

/////////////////////////////////////////////////

export function makeScope(expression: Mutable<AST>): AST {
	const globalEnv = makeEnviroment();

	expression.env = globalEnv;

	(function scope(expression: AST, env: Enviroment) {
		switch (expression.type) {
			case boolean:
			case number:
			case string:
				break;

			case variableDefinition:
			case variableName: {
				const scopedEnv = env.lookup(expression.name);

				if (scopedEnv === undefined) {
					expression.env = globalEnv;
					globalEnv.def(expression.name, { refs: [], assigned: 0 });
				} else expression.env = scopedEnv;

				const def = expression.env.get(expression.name);
				def.refs.push(expression);
				expression.def = def;

				break;
			}

			case assign: {
				scope(expression.right, env);
				scope(expression.left, env);
				break;
			}

			case if_: {
				scope(expression.condition, env);
				scope(expression.then, env);

				if (expression.else !== undefined) scope(expression.else, env);

				break;
			}

			case program: {
				expression.program.forEach(exp => scope(exp, env));
				break;
			}

			case functionCall: {
				scope(expression.fn, env);
				expression.args.forEach(exp => scope(exp, env));
				break;
			}

			case lambda: {
				expression.env = env = env.extend(expression.functionName);

				if (expression.functionName !== undefined)
					env.def(expression.functionName, { refs: [], fn: true, assigned: 0 });

				expression.variables.forEach(({ name }, index) =>
					env.def(name, {
						isThisAContinuation: index === 0,
						functionArgument: true,
						assigned: 0,
						refs: [],
					})
				);

				if (expression.locals === undefined) expression.locals = [];

				expression.locals.forEach(name =>
					env.def(name, { refs: [], functionLocal: true, assigned: 0 })
				);

				scope(expression.body, env);

				break;
			}

			default:
				throw new Error(`Can't handle node \`${stringifyJson(expression)}\``);
		}
	})(expression, globalEnv);

	return expression.env;
}
