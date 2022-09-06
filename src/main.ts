import { tokenStream } from "@token-stream/index.js";
import { cpsEvaluate } from "./enviroment/cps-evaluate.js";
import { charStream } from "./token-stream/char-stream.js";
import { globalEnv } from "./code/global/index.js";
import { parse } from "./parser/index.js";
import { exec } from "./enviroment/guard.js";
import { time } from "./utils/utils.js";

import { testingYield } from "@code/fun-tests/yield.js";
import { yield_ } from "@code/internal/yield.js";
// import { simple } from "@code/fun-tests/simple.js";

////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////

// Remember, parse takes a TokenStream which takes an CharStream:
const ast = time(
	() => parse(tokenStream(charStream(yield_ + testingYield))),
	"Parse code to AST"
);

// @ts-ignore => we don't need the deprecated length:
const args: IArguments = [
	ast,
	globalEnv,
	function (result: unknown): void {
		console.log("Final result =", result);
	},
];

// Run the evaluator:
time(() => exec(cpsEvaluate, args), "execute all code");
