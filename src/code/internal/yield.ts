export const yield_ = `
with-yield = λ(func) {
  let (yield) {
    ## yield uses shift to return a value to the innermost
    ## reset call.  before doing that, it saves its own
    ## continuation in \`func\` — so calling func() again will
    ## resume from where it left off.
    yield = λ(val) {
      shift(λ(k){
        func = k;  # save the next continuation
        val;       # return the currently yielded value
      });
    };
    ## from with-yield we return a function with no arguments
    ## which uses reset to call the original function, passing
    ## to it the yield (initially) or any other value
    ## on subsequent calls
    λ(val) {
      reset( λ() func(val || yield) );
    };
  }
};
`;
