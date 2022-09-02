import { globalEnv } from "./globalEnv.js";

const pstack: Continuation[] = [];

function goto(fn: Function) {
	fn(function continuationOfGoto(r) {
		const head = pstack.pop();
		head?.(r);
	});
}

globalEnv.def(
	"reset",
	function reset(continuationOfReset: Continuation, th: Function): void {
		pstack.push(continuationOfReset);
		goto(th);
	}
);

globalEnv.def(
	"shift",
	function shift(continuationOfShift: Continuation, fn: Function): void {
		goto(function (continuationOfGoto: Continuation) {
			fn(
				continuationOfGoto,
				function shiftDelimitedContinuation(continuation1: Continuation, v) {
					pstack.push(continuation1);
					continuationOfShift(v);
				}
			);
		});
	}
);

type Continuation = Function;
