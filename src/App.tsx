import AppRouter from './components/AppRouter';
import { PerformanceMonitor } from './components/PerformanceMonitor';

function App() {
  return (
    <>
      <AppRouter />
      {import.meta.env.DEV && <PerformanceMonitor enabled={true} />}
    </>
  );
}

export default App;