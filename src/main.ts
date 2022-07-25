import { tokenStream } from "./token-stream";
import { cpsEvaluate } from "./Enviroment/cps-evaluate";
import { charStream } from "./token-stream/char-stream";
import { globalEnv } from "./code/global";
import { Execute } from "./Enviroment/guard";
import { parse } from "./parser";
import { time } from "./utils/utils";

import { simple } from "./code/fun-tests/simple";

////////////////////////////////////////////////
////////////////////////////////////////////////
////////////////////////////////////////////////

// Remember, parse takes a TokenStream which takes an CharStream:
const ast = time(
	() => parse(tokenStream(charStream(simple))),
	"parse code to AST",
);

// @ts-ignore => we dont need deprecate length:
const args: IArguments = [ast, globalEnv, function(result: unknown): void {
	console.log("Final result =", result);
}];

// Run the evaluator:
time(() => Execute(cpsEvaluate, args), "execute all code");
