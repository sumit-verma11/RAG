import { UploadPanel } from './components/UploadPanel';
import { ChatPanel } from './components/ChatPanel';

function App() {
  return (
    <div className="app">
      <h1>Chat with Your Docs</h1>
      <UploadPanel />
      <ChatPanel />
    </div>
  );
}

export default App;
