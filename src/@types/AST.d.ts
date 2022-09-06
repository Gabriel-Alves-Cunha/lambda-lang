import type { Number_Token, Operator_Token, String_Token } from "./Tokens.js";
import type { ValueOf } from "./General.js";

import { number, operator, string, variableName } from "@utils/token-types.js";
import {
	variableDefinition,
	functionCall,
	PRECEDENCE,
	boolean,
	program,
	assign,
	binary,
	lambda,
	let_,
	if_,
} from "@parser/index.js";

/////////////////////////////////////////////////

export type VariableDefinition = { definition: AST | undefined; name: string };
export type Let = { variables: readonly VariableDefinition[]; body: AST };
export type If = { condition: AST; then: AST; else: AST | undefined };
export type Binary = { operator: Operator; left: AST; right: AST };
export type Assign = { operator: "="; left: AST; right: AST };
export type FunctionCall = { args: readonly AST[]; fn: AST };
export type Program = { program: readonly AST[] };
export type Boolean = { value: true | false };
export type VariableName = { name: string };
export type Number = { value: number };
export type String = { value: string };
export type Lambda = {
	functionName: string | undefined;
	variables: readonly VariableName[];
	body: AST;
};

/////////////////////////////////////////////////

export type NarrowedAST<Type, Value> = Readonly<
	{
		type: Type;
	} & Value
>;

/////////////////////////////////////////////////

export type FunctionCall_AST = NarrowedAST<typeof functionCall, FunctionCall>;

export type VariableName_AST = NarrowedAST<typeof variableName, VariableName>;

export type Boolean_AST = NarrowedAST<typeof boolean, Boolean>;

export type Program_AST = NarrowedAST<typeof program, Program>;

export type Binary_AST = NarrowedAST<typeof binary, Binary>;

export type Lambda_AST = NarrowedAST<typeof lambda, Lambda>;

export type Assign_AST = NarrowedAST<typeof assign, Assign>;

export type Let_AST = NarrowedAST<typeof let_, Let>;

export type If_AST = NarrowedAST<typeof if_, If>;

export type VariableDefinition_AST = NarrowedAST<
	typeof variableDefinition,
	VariableDefinition
>;

export type Operator_AST = Operator_Token;

export type String_AST = String_Token;

export type Number_AST = Number_Token;

/////////////////////////////////////////////////

export type AST =
	| VariableDefinition_AST
	| FunctionCall_AST
	| VariableName_AST
	| Boolean_AST
	| Program_AST
	| Lambda_AST
	| Binary_AST
	| Assign_AST
	| Number_AST
	| String_AST
	| Let_AST
	| If_AST;

/////////////////////////////////////////////////

type Precedence = ValueOf<typeof PRECEDENCE>;
