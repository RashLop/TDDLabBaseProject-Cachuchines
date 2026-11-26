import dividir from "./divisor.js";

describe("Dividir", () => {
  it("deberia dividir dos numeros", () => {
    expect(dividir(12, 3)).toEqual(4);
  });
});
