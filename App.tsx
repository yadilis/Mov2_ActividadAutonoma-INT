import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from './context/ThemeContext';
import Navegador from './navigation/MainNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <Navegador />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
