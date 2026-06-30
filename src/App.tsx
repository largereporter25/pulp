import { useState } from 'react';
import Library from './pages/Library';
import Editor from './pages/Editor';
import Manifesto from './components/Manifesto';

export default function App() {
  const [view, setView] = useState<'library' | 'editor'>('library');
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [showManifesto, setShowManifesto] = useState(true);

  const openDoc = (id: string) => {
    setActiveDocId(id);
    setView('editor');
  };

  const goBack = () => {
    setView('library');
    setActiveDocId(null);
  };

  return (
    <div className="w-screen h-screen overflow-hidden">
      {showManifesto && <Manifesto onEnter={() => setShowManifesto(false)} />}
      {view === 'library' ? (
        <Library onOpen={openDoc} />
      ) : activeDocId ? (
        <Editor docId={activeDocId} onBack={goBack} />
      ) : null}
    </div>
  );
}
