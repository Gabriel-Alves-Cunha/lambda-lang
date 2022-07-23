import { tokenStream } from "./token-stream";

import { makeEnviroment } from "./Enviroment";
import { charStream } from "./token-stream/char-stream";
import { evaluate } from "./Enviroment/evaluate";
import { internal } from "./code/internal";
import { parse } from "./parser";
import { time } from "./utils/utils";

// Remember, parse takes a TokenStream which takes an CharStream:
const ast = time(
	() => parse(tokenStream(charStream(internal))),
	"parse(internal)",
);

// Create the global environment:
const globalEnv = makeEnviroment();

// Define the `log` primitive function:
globalEnv.def("log", function(...args: any[]) {
	console.log(...args);
});
// Defining the `print` primitive function:
globalEnv.def("print", function(...args: any[]) {
	process.stdout.write(args.join(" "));
});

// Run the evaluator:
time(() => evaluate(ast, globalEnv), "evaluate code"); // Should log `5`.
