import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// ⬇️ Import the routing wrapper instead of App directly
import Main from "./Main.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
