import { useState } from 'react';
import Library from './pages/Library';
import Editor from './pages/Editor';

export default function App() {
  const [view, setView] = useState<'library' | 'editor'>('library');
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

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
      {view === 'library' ? (
        <Library onOpen={openDoc} />
      ) : activeDocId ? (
        <Editor docId={activeDocId} onBack={goBack} />
      ) : null}
    </div>
  );
}
