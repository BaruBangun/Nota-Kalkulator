import { HashRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { SettingsProvider, useSettings } from '@/state/settings';
import NewNote from '@/pages/NewNote';
import History from '@/pages/History';
import Settings from '@/pages/Settings';

function AppToaster() {
  const { resolvedTheme } = useSettings();
  return (
    <Toaster
      position="top-center"
      theme={resolvedTheme}
      duration={2200}
      toastOptions={{ className: 'font-sans text-sm' }}
    />
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<NewNote />} />
          <Route path="/note/:id" element={<NewNote />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NewNote />} />
        </Routes>
      </HashRouter>
      <AppToaster />
    </SettingsProvider>
  );
}
