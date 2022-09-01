import type { Enviroment } from "./index.js";
import type { Operator } from "../@types/Tokens.js";

import { assertUnreachable, stringifyJson } from "@utils/utils.js";
import { variableName, number, string } from "@utils/token-types.js";
import { guard } from "./guard.js";
import {
	type VariableDefinition,
	type VariableName,
	type Lambda,
	type AST,
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

export function cpsEvaluate(
	expression: AST | undefined,
	environment: Enviroment,
	callback: Function,
): void {
	guard(cpsEvaluate, arguments);

	const type = expression?.type;
	if (type === undefined) return;

	switch (type) {
		// For constants, we just need to return their value. But
		// remember, there's no return—instead we're invoking the
		// callback with the value.
		case number:
		case string:
		case boolean:
			callback(expression.value);
			return;

		case variableName:
			// Fetch the variable from the environment, pass it to the callback.
			callback(environment.get(expression.value));
			return;

		case assign: {
			/** For "assign" nodes we need to evaluate the "right" expression
			 * first. For this we're calling evaluate, passing a callback that
			 * will get the result (as right). And then we just invoke our
			 * original callback with the result of setting the variable
			 * (which will be the value, in fact).
			 */

			if (expression.left.type !== variableName)
				throw new Error(
					`Cannot assign to 'expression.left' from: ${
						stringifyJson(expression)
					}`,
				);

			cpsEvaluate(
				expression.right,
				environment,
				function currentContinuation(right: AST): void {
					guard(currentContinuation, arguments);

					callback(environment.set(
						// `expression.left` is (because of above if guard) an AST of
						(expression.left as { type: typeof variableName; } & VariableName)
							.value,
						right,
					));
				},
			);

			return;
		}

		case binary: {
			/** Similarly, for "binary" nodes we need to evaluate the "left"
			 * node, then the "right" node, and then invoke the callback with
			 * the result of applying the operator. Same as before, we call
			 * evaluate recursively and pass a callback that carries on the
			 * next steps.
			 */

			cpsEvaluate(
				expression.left,
				environment,
				function currentContinuation(left: AST): void {
					guard(currentContinuation, arguments);

					cpsEvaluate(
						expression.right,
						environment,
						function currentContinuation(right: AST): void {
							guard(currentContinuation, arguments);

							callback(applyOperand(expression.operator, left, right));
						},
					);
				},
			);

			return;
		}

		case let_: {
			/** "Let" looks a little more complicated, but it's very simple.
			 * We have a number of variable definitions. Their "def" (initial value)
			 * can be missing, in which case we make them false by default;
			 * but when the value is present, we need to call evaluate recursively
			 * in order to compute it.
			 *
			 * If you worked in NodeJS you might have solved similar problems many
			 * times already. Because of the callback, we can't use a straight for,
			 * so we need to compute those expressions one by one (imagine the
			 * evaluate function might not return immediately, but asynchronously).
			 * The loop function below (immediately invoked) receives an environment
			 * and the index of the current definition to compute.
			 *
			 * * If that index is equal to vars.length that means we finished and
			 * the environment has all the defs, hence we evaluate(exp.body, env, callback).
			 * Note that this time we're not invoking the callback ourselves, but
			 * just pass it to evaluate as the next thing to do after running exp.body.
			 *
			 * * If the index is smaller then evaluate the current definition and
			 * pass a callback that will loop(scope, i + 1), after extending the
			 * environment with the definition that we just computed.
			 */

			(function loop(environment: Enviroment, index: number): void {
				guard(loop, arguments);

				if (index < expression.variables.length) {
					const variable = expression.variables[index] as VariableDefinition;

					if (variable.definition !== undefined)
						cpsEvaluate(
							variable.definition,
							environment,
							function currentContinuation(value: AST): void {
								guard(currentContinuation, arguments);

								const scope = environment.extend(variable.name);
								scope.def(variable.name, value);

								loop(scope, index + 1);
							},
						);
					else {
						const scope = environment.extend(variable.name);
						scope.def(variable.name, false);

						loop(scope, index + 1);
					}
				} else cpsEvaluate(expression.body, environment, callback);
			})(environment, 0);

			return;
		}

		case lambda:
			callback(makeLambda(environment, expression));
			return;

		case if_: {
			/** For executing an "if", we evaluate the condition. If
			 * it's not false then evaluate the "then" branch, otherwise
			 * evaluate the "else" branch if it's present, otherwise
			 * pass false to the callback. Again note that for "then"/"else"
			 * we don't have to run the callback ourselves, but just
			 * pass it to evaluate as the "next thing to do" after
			 * computing those expressions.
			 */

			cpsEvaluate(
				expression.condition,
				environment,
				function currentContinuation(condition: AST | false): void {
					guard(currentContinuation, arguments);

					if (condition !== false)
						cpsEvaluate(expression.then, environment, callback);
					else if (expression.else !== undefined)
						cpsEvaluate(expression.else, environment, callback);
					else callback(false);
				},
			);

			return;
		}

		case program: {
			/** A "Program" node is handled somewhat similar to "Let",
			 * but it's simpler because it doesn't need to extend
			 * scope and define variables. Any case, the same general
			 * pattern: we have a loop function which handles the
			 * expression number i. When i is equal to program.length
			 * then we're done, so just return the value that the last
			 * expression evaluated to (and by "return" I mean, of course,
			 * invoke the callback with it). Note we're keeping track
			 * of the last value by passing it as argument to loop
			 * (initially false, in case the prog body is empty).
			 */

			(function loop(last: AST | false, index: number): void {
				guard(loop, arguments);

				const program = expression.program[index] as AST;

				if (index < expression.program.length)
					cpsEvaluate(
						program,
						environment,
						function currentContinuation(value: AST | false): void {
							guard(currentContinuation, arguments);

							loop(value, index + 1);
						},
					);
				else callback(last);
			})(false, 0);

			return;
		}

		case functionCall: {
			/** For a "FunctionCall" node we need to evaluate "fn" and
			 * then evaluate the arguments, in order. Again, a loop
			 * function handles them similarly as we needed to do in
			 * "Let" and "Program", only this time it builds an array
			 * with the results. The first value in that array must be
			 * the callback, because closures returned by make_lambda
			 * will also be in continuation-passing style, thus instead
			 * of using return they will invoke the callback with the result.
			 */

			cpsEvaluate(
				expression.fn,
				environment,
				function currentContinuation(fn: Function | undefined): void {
					guard(currentContinuation, arguments);

					console.assert(
						typeof fn === "function" || fn === undefined,
						`[ERROR] At cpsEvaluate() FunctionCall, fn should be a function, got = ${
							stringifyJson(fn)
						}.`,
					);

					(function loop(
						args: [callback: Function, ...asts: AST[]],
						index,
					): void {
						guard(loop, arguments);

						const arg = expression.args[index];

						if (index < expression.args.length)
							cpsEvaluate(
								arg,
								environment,
								function currentContinuation(arg: AST): void {
									guard(currentContinuation, arguments);

									// maybe push?
									args[index + 1] = arg;
									loop(args, index + 1);
								},
							);
						else fn?.apply(null, args);
					})([callback], 0);
				},
			);

			return;
		}

		case variableDefinition: {
			throw new Error(
				`Should not get here at 'cpsEvaluate() variable definition', got expression = ${
					stringifyJson(expression)
				};\nenviroment = ${stringifyJson(environment)};\ncallback = ${
					stringifyJson(callback)
				}`,
			);
		}

		default:
			assertUnreachable(type);
	}
}

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
// Helper functions:

function isNumber(x: unknown): x is number {
	return typeof x === "number";
}

function applyOperand(
	operator: Operator,
	left: unknown,
	right: unknown,
): unknown | number {
	function num(x: unknown): number {
		if (!isNumber(x))
			throw new Error(
				`Expected number, got: ${stringifyJson(x)};\nargs = ${
					stringifyJson(arguments)
				}.`,
			);

		return x;
	}

	/////////////////////////////////////////////////

	function div(x: unknown): number {
		if (num(x) === 0) throw new Error("Can't divide by zero");

		return x as number;
	}

	/////////////////////////////////////////////////

	switch (operator) {
		case "+":
			return num(left) + num(right);

		case "-":
			return num(left) - num(right);

		case "*":
			return num(left) * num(right);

		case "/":
			return num(left) / div(right);

		case "%":
			return num(left) % div(right);

		case "&&":
			return left !== false && right;

		case "||":
			return left !== false ? left : right;

		case "<":
			return num(left) < num(right);

		case ">":
			return num(left) > num(right);

		case "<=":
			return num(left) <= num(right);

		case ">=":
			return num(left) >= num(right);

		case "==":
			return left === right;

		case "!=":
			return left !== right;

		default:
			throw new Error(`Can't apply operator \`${operator}\`.`);
	}
}

/** In this version of our evaluator, all functions will
 * receive as first argument the "continuation" — a
 * callback to invoke with the result. Following it are
 * the other arguments as passed at run-time, but this
 * one is always inserted by the evaluator. Here's the
 * code for the new make_lambda:
 */
function makeLambda(
	environment: Enviroment,
	expression:
		& { type: typeof lambda; }
		& Lambda, // AST
) {
	console.assert(
		expression.type === lambda,
		`"[ERROR] 'expression' should be of type Lambda! got = ${
			stringifyJson(expression)
		}.`,
	);

	if (expression.functionName !== undefined) {
		environment = environment.extend(expression.functionName);
		environment.def(expression.functionName, lambda_);
	}

	function lambda_(callback: Function): void {
		guard(lambda_, arguments);

		const names = expression.variables.map(v => v.value);
		const scope = environment.extend(lambda);

		names.forEach((name, index) => {
			scope.def(
				name,
				index + 1 < arguments.length ? arguments[index + 1] : false,
			);
		});

		cpsEvaluate(expression.body, scope, callback);
	}

	/** It extends the scope with the new variable bindings
	 * (for the arguments). It must account for that "callback"
	 * argument as being the first one (hence, i + 1 when
	 * wondering in the arguments). And finally it uses
	 * evaluate to run the function body in the new scope,
	 * as before, but passing the callback to the evaluator
	 * instead of returning the result.
	 */

	return lambda_;
}
