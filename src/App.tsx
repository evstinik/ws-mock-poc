import { useEffect } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import './App.css';

function App() {
  const { sendJsonMessage, readyState, lastJsonMessage } = useWebSocket('ws://localhost:3007', {
    onOpen: () => console.log('opened'),
    //Will attempt to reconnect on all close events, such as server shutting down
    shouldReconnect: () => true,
  });

  useEffect(() => {
    if ((lastJsonMessage as any)?.action === 'pong') {
      alert('Received pong!');
    }
  }, [lastJsonMessage]);

  return (
    <main>
      <h1>Websocket example</h1>
      <p>Status: {getStatus(readyState)}</p>
      <button
        data-testid='the-button'
        onClick={() => {
          sendJsonMessage({ action: 'ping' });
        }}
      >
        Click me to send websocket message
      </button>
    </main>
  );
}

export default App;

const getStatus = (readyState: number) => {
  return (
    {
      [ReadyState.CONNECTING]: 'Connecting',
      [ReadyState.OPEN]: 'Open',
      [ReadyState.CLOSING]: 'Closing',
      [ReadyState.CLOSED]: 'Closed',
      [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
    }[readyState] ?? 'Unknown'
  );
};
