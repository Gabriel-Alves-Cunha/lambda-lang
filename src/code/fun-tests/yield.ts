export const testingYield = `
with-yield = λ(func) {
  let (yield) {
    yield = λ(val) {
      shift(λ(k){
        func = k;
        val;
      });
    };

    λ(val) {
      reset( λ() func(val || yield) );
    };
  }
};

foo = with-yield(λ(yield){
  yield(1);
  yield(2);
  yield(3);
  "DONE";
});

log(foo());  # prints 1
log(foo());  # prints 2
log(foo());  # prints 3
log(foo());  # prints DONE
`;
