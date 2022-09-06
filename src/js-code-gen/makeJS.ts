import type {
	VariableDefinition_AST,
	FunctionCall_AST,
	VariableName_AST,
	Program_AST,
	Boolean_AST,
	Assign_AST,
	Binary_AST,
	Lambda_AST,
	Number_AST,
	String_AST,
	Let_AST,
	If_AST,
	AST,
} from "../@types/AST.js";

import { number, string, variableName } from "@utils/token-types.js";
import { log } from "@utils/utils.js";
import {
	variableDefinition,
	functionCall,
	program,
	boolean,
	binary,
	lambda,
	assign,
	FALSE,
	let_,
	if_,
} from "@parser/index.js";

export function makeJS(expression: AST): string {
	return js(expression);

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////

	function js(expression: AST): string {
		switch (expression.type) {
			case boolean:
			case number:
			case string:
				return jsAtom(expression);

			case variableDefinition:
			case variableName:
				return jsVariableDefinition(expression);

			case binary:
				return jsBinary(expression);

			case assign:
				return jsAssign(expression);

			case let_:
				return jsLet(expression);

			case lambda:
				return jsLambda(expression);

			case if_:
				return jsIf(expression);

			case program:
				return jsProgram(expression);

			case functionCall:
				return jsFunctionCall(expression);

			default: {
				throw new Error(
					"Dunno how to make_js for " + JSON.stringify(expression)
				);
			}
		}
	}

	/////////////////////////////////////////////////
	/////////////////////////////////////////////////

	function jsAtom(expression: JS_Atom): string {
		log("On jsAtom:", expression);

		const code = JSON.stringify(expression.value);

		log("jsAtom code:", code);

		return code;
	}

	/////////////////////////////////////////////////

	function jsVariableDefinition(expression: JS_VariableDefinition): string {
		log("On jsVariableDefinition:", expression);

		const code = makeJsVariableName(expression.name);

		log("jsVariableDefinition code:", code);

		return code;
	}

	/////////////////////////////////////////////////

	function jsBinary(expression: Binary_AST): string {
		log("On jsBinary:", expression);

		const code = `${js(expression.left)} ${expression.operator} ${js(
			expression.right
		)}`;

		log("jsBinary code:", code);

		return code;
	}

	/////////////////////////////////////////////////

	// assign nodes are compiled the same as binary
	function jsAssign(expression: Assign_AST): string {
		log("On jsAssign:", expression);

		// let
		const code = `${js(expression.left)} ${expression.operator} ${js(
			expression.right
		)}`;

		log("jsAssign code:", code);

		return code;
	}

	/////////////////////////////////////////////////

	function jsLambda(expression: Lambda_AST): string {
		log("On jsLambda:", expression);

		const currentContinuation =
			expression.functionName ?? "β_current_continuation";

		const functionName = makeJsVariableName(currentContinuation);

		const variables = expression.variables
			.map(({ name }) => makeJsVariableName(name))
			.join(", ");

		const body = js(expression.body);

		const code = `\
(function ${functionName}(${variables}) {
	GUARD(arguments, ${currentContinuation});

	${body}
})`;

		log("jsLambda code:", code);

		return code;
	}

	/////////////////////////////////////////////////

	function jsLet(expression: Let_AST): string {
		log("On jsLet:", expression);

		if (expression.variables.length === 0) return js(expression.body);

		const fnAST: Lambda_AST = {
			variables: [{ name: expression.variables[0]!.name }],
			functionName: undefined,
			type: lambda,
			body: {
				variables: expression.variables.slice(1),
				body: expression.body,
				type: let_,
			},
		};

		const iife: FunctionCall_AST = {
			args: [expression.variables[0]!.definition || FALSE],
			type: functionCall,
			fn: fnAST,
		};

		log("jsLet iife:", iife);

		return `(${js(iife)})`;
	}

	/////////////////////////////////////////////////

	function jsIf(expression: If_AST): string {
		log("On jsIf:", expression);

		const code = `\
(${js(expression.condition)} !== false)
	? ${js(expression.then)}
	: ${js(expression.else || FALSE)}`;

		log("jsIf code:", code);

		return code;
	}

	/////////////////////////////////////////////////

	function jsProgram(expression: Program_AST): string {
		log("On jsProgram:", expression);

		const code = `${expression.program.map(js).join("\n")}`;

		log("jsProgram code:", code);

		return code;
	}

	/////////////////////////////////////////////////

	function jsFunctionCall(expression: FunctionCall_AST): string {
		log("On jsFunctionCall:", expression);

		const code = `${js(expression.fn)}(${expression.args.map(js).join(", ")})`;

		log("jsFunctionCall code:", code);

		return code;
	}

	/////////////////////////////////////////////////
}

function makeJsVariableName(name: string): string {
	return name;
}

/////////////////////////////////////////////////
/////////////////////////////////////////////////
/////////////////////////////////////////////////
// Types:

type JS_VariableDefinition = VariableDefinition_AST | VariableName_AST;

type JS_Atom = Boolean_AST | String_AST | Number_AST;

/////////////////////////////////////////////////
