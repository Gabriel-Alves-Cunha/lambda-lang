export const returnCode = `
with-return = λ(fn) λ() call-with-current-continuation(fn);

foo = with-return(
	λ(return) {
		log("foo");
		return("DONE");
		log("bar");
	}
);

foo();
`;
