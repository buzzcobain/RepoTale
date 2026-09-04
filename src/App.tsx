import React from 'react';
import { SettingsProvider } from './context/SettingsContext';
import { StoryProvider } from './context/StoryContext';
import { Header } from './components/Header';
import { SplitScreenContainer } from './components/SplitScreenContainer';
import { QASidecarDrawer } from './components/sidecar/QASidecarDrawer';

export const App: React.FC = () => {
  return (
    <SettingsProvider>
      <StoryProvider>
        <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans antialiased">
          <Header />
          <SplitScreenContainer />
          <QASidecarDrawer />
        </div>
      </StoryProvider>
    </SettingsProvider>
  );
};

export default App;
