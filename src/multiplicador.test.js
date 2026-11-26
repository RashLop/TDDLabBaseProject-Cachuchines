import multiplicar from "./multiplicador.js";

describe("Multiplicar", () => {
  it("deberia multiplicar dos numeros", () => {
    expect(multiplicar(4, 3)).toEqual(12);
  });
});
