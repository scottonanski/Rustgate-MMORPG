
import { useUiStore } from './ui/state/uiStore.ts';
import { WelcomeScreen } from './ui/screens/Welcome.tsx';
import { PlayScreen } from './ui/screens/Play.tsx';

function App() {
  const { currentScreen } = useUiStore();

  return (
    <main className="app-shell">
      {currentScreen === 'welcome' && <WelcomeScreen />}
      {currentScreen === 'play' && <PlayScreen />}
    </main>
  );
}

export default App;
