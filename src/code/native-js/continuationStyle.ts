import type { AST } from "../../@types/AST.js";

import { toContinuePassingStyle } from "@js-code-gen/toContinuePassingStyle.js";
import { tokenStream } from "@token-stream/index.js";
import { charStream } from "@token-stream/char-stream.js";
import { minifyJs } from "@utils/minifyJsCode.js";
import { makeJS } from "@js-code-gen/makeJS.js";
import { parse } from "@parser/index.js";
import { time } from "@utils/utils.js";

// @ts-ignore => We're assigning it to the global execution for the code below.
global.log = console.log;
// @ts-ignore => We're assigning it to the global execution for the code below.
global.time = time;

// some test code here
const code1 = "sum = lambda(x, y) x + y; log(sum(2, 3));";
const code2 = `fib = λ(n) if n < 2 then n else fib(n - 1) + fib(n - 2);

log(fib(16));`;
const code3 = `fib = λ(n) {
  if n < 2 then n
  else
    fib(n - 1) +
    fib(n - 2);
};
log(fib(10));`;

// get the AST
const ast = time(
	() => parse(tokenStream(charStream(code3))),
	"Parse code to ast"
);

const cps = toContinuePassingStyle(ast, function (x: AST) {
	return x;
});

const jsCode = makeJS(cps);

console.log("\n-----------\nCPS:\n", cps, "\n-----------");
console.log("Js code:\n", jsCode, "\n-----------");
console.log("Minifyed code:\n", minifyJs(jsCode), "\n-----------");

// execute it
eval(jsCode); // prints 5
