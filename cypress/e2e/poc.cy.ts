interface AppWebSocketMessage {
  action: string;
}
let lastWebSocketRequest: AppWebSocketMessage | undefined;

describe("template spec", () => {
  it("passes", () => {
    cy.mockWebSocket("ws://localhost:3007/", {
      useDefaultWebSocket: true,
    });
    cy.registerSocketRequestHandler((request) => {
      lastWebSocketRequest = request as AppWebSocketMessage;
      if (lastWebSocketRequest.action == "ping") return { action: "pong" };
    });

    cy.visit("/");

    Cypress.on("window:alert", (str) => {
      expect(str).to.eq("Received pong!");
    });
    cy.get('[data-testid="the-button"]')
      .click()
      .then(() => {
        cy.wrap(lastWebSocketRequest, { log: false }).as(
          "lastWebSocketRequest"
        );
        cy.get("@lastWebSocketRequest").should("deep.equal", {
          action: "ping",
        });
        cy.wait(10000);
      });
  });
});
