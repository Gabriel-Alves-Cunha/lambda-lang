export const throwAndCatch = `
throw = λ() {
	log("[ERROR] No more catch handlers!");
	halt();
};

catch = λ(tag, fn) {
	call-with-current-continuation(λ(callback) {
		let (rethrow = throw, ret) {
			# Install a new handler that catches the given tag.
			throw = λ(tag_, value) {
				throw = rethrow; # Either way, restore the saved handler.
				if tag_ == tag then callback(value) else throw(tag_, value);
			};

			# Then call our function and store the result:
			ret = fn();

			# If our function returned normally (not via a throw)
			# then we will get here. Restore the old handler:
			throw = rethrow;

			# And return the result:
			ret;
		};
	});
};
`;
