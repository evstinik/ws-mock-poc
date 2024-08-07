describe("template spec", () => {
  beforeEach(() => {
    cy.visit("/");
  });
  it("passes", () => {
    cy.get('[data-testid="the-button"]')
      .click()
      .assertSocketRequest({ action: "ping" });
  });
});
