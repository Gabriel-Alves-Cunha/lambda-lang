import { dbg, stringifyJson, time } from "../utils/utils";
import { Enviroment } from ".";
import { Operator } from "../@types/general-types";
import { AST } from "../parser";

export function evaluate(expression: AST, environment: Enviroment): unknown {
	const ret: unknown = time(
		() => {
			switch (expression.type) {
				// For constant nodes, we just return their value:
				case "Boolean":
				case "Number":
				case "String":
					return expression.value;

				/////////////////////////////////////////////////

				case "Variable name":
					// Variables are fetched from the environment. Remember
					// that "Variable name" tokens contain the name in the value property:
					return environment.get(expression.value);

				/////////////////////////////////////////////////

				case "Assign": {
					/**
					 * For assignment, we need to check if the left side is a
					 * "Variable name" token (if not, throw an error; we don't
					 * support assignment to anything else for now). Then we
					 * use env.set to set the value. Note that the value needs
					 * to be computed first by calling evaluate recursively.
					 */
					if (expression.left.type !== "Variable name")
						throw new Error(
							`Cannot assign to ${stringifyJson(expression.left)}`,
						);

					return environment.set(
						expression.left.value,
						evaluate(expression.right, environment),
					);
				}

				/////////////////////////////////////////////////

				case "Binary": {
					/**
					 * A "Binary" node needs to apply an operator to two operands.
					 * Again, we need to call the evaluator recursively to compute
					 * the left and right operands:
					 */
					return applyOperand(
						expression.operator,
						evaluate(expression.left, environment),
						evaluate(expression.right, environment),
					);
				}

				/////////////////////////////////////////////////

				case "lambda (function)": {
					/**
					 * A "lambda (function)" node will actually result in a JavaScript closure,
					 * so it will be callable from JavaScript just like an ordinary
					 * function.
					 */
					return makeLambda(environment, expression);
				}

				/////////////////////////////////////////////////

				case "if": {
					/**
					 * Evaluating an "if" node is simple: first evaluate the condition.
					 * If it's not false then evaluate the "then" branch and return its
					 * value. Otherwise, evaluate the "else" branch, if present, or return false.
					 */
					const condition = evaluate(expression.condition, environment);

					if (condition !== false) return evaluate(
							expression.then,
							environment,
						);

					return expression.else ?
						evaluate(expression.else, environment) :
						false;
				}

				/////////////////////////////////////////////////

				case "Program": {
					/**
					 * A "Program" is a sequence of expressions. We just
					 * evaluate them in order and return the value of
					 * the last one. For an empty sequence, the return
					 * value is initialized to false.
					 */
					let value: unknown = false;

					expression.program.forEach(expr => {
						value = evaluate(expr, environment);
					});

					return value;
				}

				/////////////////////////////////////////////////

				case "Function call": {
					/**
					 * For a "call" node we need to call a function. First we
					 * evaluate the function, which should return a normal JS function,
					 * then we evaluate the args and apply that function.
					 */
					const fn = evaluate(expression.fn, environment);

					console.assert(
						typeof fn === "function",
						"`fn` should be a function. It is:",
						{ fn, type: typeof fn },
					);

					return (fn as Function).apply(
						null,
						expression.args.map(arg => evaluate(arg, environment)),
					);
				}

				/////////////////////////////////////////////////

				default: {
					throw new Error(
						`I don't know how to evaluate this: ${stringifyJson(expression)}`,
					);
				}

					/////////////////////////////////////////////////
			}
		},
		`\nevaluate(expression: AST = ${
			stringifyJson(expression)
		}, environment: Enviroment = ${stringifyJson(environment)}).`,
	);

	dbg(
		`\n"evaluate()" result is: ${
			stringifyJson({ typeof: typeof ret, ret })
		}.\n`,
	);

	return ret;
}

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
// Helper functions:

function applyOperand(
	operator: Operator,
	left: unknown,
	right: unknown,
): unknown | number {
	const num = (x: unknown): number => {
		if (typeof x !== "number")
			throw new Error(`Expected number, got: ${stringifyJson(x)}`);

		return x;
	};

	/////////////////////////////////////////////////

	const div = (x: unknown): number => {
		if (num(x) === 0) throw new Error("Can't divide by zero");

		return x as number;
	};

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
			throw new Error(`Can't apply operator "${operator}".`);
	}
}

/////////////////////////////////////////////////

/**
 * It returns a plain JavaScript function that
 * encloses over the environment and the expression to evaluate.
 * It's important to understand that nothing happens when this
 * closure is created — but when it's called, it will extend the
 * environment that it saved at creation time with the new bindings
 * of arguments/values (if less values are passed than the function's
 * argument list, the missing ones will get the value false). And
 * then it just evaluates the body in the new scope.
 */
function makeLambda(environment: Enviroment, expression: AST) {
	return function lambda() {
		// This is just to please Typescript:
		if (expression.type !== "lambda (function)")
			throw new Error(
				`"Should never get here! expression = ${stringifyJson(expression)}`,
			);
		//

		const names = expression.variableNames;
		const scope = environment.extend();

		names.forEach((name, index) =>
			scope.def(name, index < arguments.length ? arguments[index] : false)
		);

		return evaluate(expression.body, scope);
	};
}
