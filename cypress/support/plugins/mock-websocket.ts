import { Client, Server, WebSocket } from "mock-socket";
import { isMatching } from "ts-pattern";
import { UnknownPattern } from "ts-pattern/dist/types/Pattern";

interface RequestResponse {
  request: WebSocketMessage;
  response: WebSocketMessage;
}

const defaultOptions: MockWebSocketOptions = {
  useDefaultWebSocket: false,
  webSocketCtorName: "MockedWebSocket",
};

let socketPromise: Promise<Client> = null;
let mockServer: Server = null;
let requestResponses: RequestResponse[] = [];
let requestHandlers: RequestHandler[] = [];

const extractValue = <T>(value: ValueOrGetter<T>) =>
  typeof value === "function" ? (value as () => T)() : value;

const isObject = (message: WebSocketMessage): message is object =>
  typeof message === "object" && message != null;

const matches = (request: WebSocketMessage, message: string): boolean => {
  if (isObject(request)) {
    const matchesRequest = isMatching(request as UnknownPattern);
    const actual = JSON.parse(message);
    return matchesRequest(actual);
  } else {
    return (request as string) === message;
  }
};

const spyRequestHandler = {
  call(message: WebSocketMessage) {
    return message;
  },
};
function sendMessage(socket: Client, message: WebSocketMessage) {
  socket.send(JSON.stringify(message));
}

function getServer(
  url: string,
  connectionResponseData?: WebSocketMessage
): Promise<Client> {
  return new Cypress.Promise((resolve) => {
    if (mockServer) {
      // console.log("Close existing server");
      mockServer.close();
    }

    mockServer = new Server(url, { mock: true });
    mockServer.on("connection", (socket) => {
      // console.log("Connected");
      if (connectionResponseData) {
        sendMessage(socket, connectionResponseData);
      }

      socket.on("message", (message) => {
        spyRequestHandler.call(JSON.parse(message as string));

        for (const handler of requestHandlers) {
          const response = handler(JSON.parse(message as string));
          // console.log("got response from handler", response);
          if (response) {
            sendMessage(socket, response);
            break;
          }
        }

        for (const requestResponse of requestResponses) {
          if (matches(requestResponse.request, message as string)) {
            sendMessage(socket, requestResponse.response);
            break;
          }
        }
      });
      resolve(socket);
    });
  });
}

function mockWebSocket(): Cypress.Chainable<any> {
  const url = Cypress.env("mockWebSocketUrl");
  if (!url) throw new Error("No mockWebSocketUrl set in Cypress.env()");
  cy.spy(spyRequestHandler, "call").as("webSocketRequest");
  cy.on("window:before:load", (win) => {
    win.WebSocket = WebSocket;
    socketPromise = getServer(url);
  });

  cy.on("test:after:run", () => {
    // console.log("Mock Socket: Stopping Mock Server");
    mockServer.close();
    requestResponses = [];
    requestHandlers = [];
  });
  return cy.log("Mock Socket: Mocking WebSocket");
}

function triggerSocketEvent(
  message: ValueOrGetter<WebSocketMessage>
): Cypress.Chainable<any> {
  return cy.wrap(socketPromise).then((socket: unknown) => {
    const extractedMessage = extractValue(message);
    cy.log("Mock Socket: Sending message", extractedMessage);
    (socket as Client).send(JSON.stringify(extractedMessage));
  });
}

function triggerSocketEvents(
  messages: ValueOrGetter<WebSocketMessage[]>
): Cypress.Chainable<any> {
  return cy.wrap(socketPromise).then((socket: unknown) => {
    const extractedMessages = extractValue(messages);
    cy.log("Mock Socket: Sending messages", messages);
    extractedMessages.forEach((message) => {
      (socket as Client).send(JSON.stringify(message));
    });
  });
}

function registerSocketRequestHandler(
  handler: RequestHandler
): Cypress.Chainable<any> {
  cy.log("Registering handler");
  requestHandlers.push(handler);
  return null;
}

function registerSocketRequestResponse(
  request: WebSocketMessage,
  response: WebSocketMessage
): Cypress.Chainable<any> {
  requestResponses.push({
    request,
    response,
  });
  return null;
}

function assertSocketRequest(
  message: WebSocketMessage
): Cypress.Chainable<any> {
  return cy
    .get("@webSocketRequest")
    .should("have.been.calledOnceWith", message);
}

type WebSocketMessage = Object | string;
type WebSocketCtor = {
  new (url: string, protocols?: string | string[] | undefined): WebSocket;
};
type RequestHandler = (
  message: WebSocketMessage
) => WebSocketMessage | undefined;
type ValueOrGetter<T> = T | (() => T);

interface MockWebSocketOptions {
  connectionResponseMessage?: WebSocketMessage;
  useDefaultWebSocket?: boolean;
  webSocketCtorName?: string;
}

declare global {
  namespace Cypress {
    interface Chainable {
      mockWebSocket: typeof mockWebSocket;
      registerSocketRequestHandler: typeof registerSocketRequestHandler;
      registerSocketRequestResponse: typeof registerSocketRequestResponse;
      triggerSocketEvent: typeof triggerSocketEvent;
      triggerSocketEvents: typeof triggerSocketEvents;
      assertSocketRequest: typeof assertSocketRequest;
    }
  }
}

Cypress.Commands.addAll({
  mockWebSocket,
  registerSocketRequestHandler,
  registerSocketRequestResponse,
  triggerSocketEvent,
  triggerSocketEvents,
  assertSocketRequest,
});

export {};
