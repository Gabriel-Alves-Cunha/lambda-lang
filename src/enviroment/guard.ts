let STACK_LENGHT: number | undefined;

export function guard(fn: Function, args: unknown[] | IArguments): void {
	// @ts-ignore => undefined - 1 == NaN, so it's ok
	if (--STACK_LENGHT < 0) throw new Continuation(fn, args);
}

export class Continuation {
	args: unknown[];
	fn: Function;

	constructor(fn: Function, args: unknown[]) {
		this.args = args;
		this.fn = fn;
	}
}

/** Execute takes a function to run and arguments to pass it.
 * It does that in a loop, but note the return—in the event
 * the function runs without blowing the stack, we stop there.
 * STACKLEN is initialized every time we resume the loop. I
 * found 200 to be a good value. When a Continuation is caught,
 * reinstate the new function and arguments and continue the
 * loop. The stack is cleared at this point by the exception,
 * so we can nest again.
 */
export function exec(fn: Function, args: unknown[] | IArguments) {
	while (true)
		try {
			STACK_LENGHT = 200;

			return fn.apply(null, args);
		} catch (exception) {
			if (exception instanceof Continuation) {
				args = exception.args;
				fn = exception.fn;
			} else throw exception;
		}
}
