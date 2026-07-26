import './App.css';
import { BackgroundArt } from './components/BackgroundArt';
import { IconSparkle } from './components/icons';
import { UploadPanel } from './components/UploadPanel';
import { ChatPanel } from './components/ChatPanel';

function App() {
  return (
    <>
      <BackgroundArt />
      <div className="app">
        <header className="app-header">
          <div className="app-logo">
            <IconSparkle width={22} height={22} />
          </div>
          <h1>Chat with Your Docs</h1>
          <p className="app-subtitle">
            Upload a document and ask questions — answers are grounded in your files, with sources cited.
          </p>
        </header>
        <UploadPanel />
        <ChatPanel />
      </div>
    </>
  );
}

export default App;
