import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './utils/trackInteraction.js'
import App from './App.jsx'
import { initHubAppCheck } from './utils/appCheck.js'

initHubAppCheck()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
