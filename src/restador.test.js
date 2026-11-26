import restar from "./restador.js";

describe("Restar", () => {
  it("deberia restar dos numeros", () => {
    expect(restar(7, 2)).toEqual(5);
  });
});
