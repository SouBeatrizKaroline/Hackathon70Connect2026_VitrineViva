/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { installTouchIcon } from '@/lib/faviconAssets'
import './main.css'

// Ícone para tela inicial do celular (iOS não usa SVG em apple-touch-icon)
installTouchIcon()

// @skip-protected: Do not remove. Required for React rendering.
createRoot(document.getElementById('root')!).render(<App />)
