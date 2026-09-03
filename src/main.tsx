import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { View } from './view/Return'
import { Live } from './view/Live'
import './index.css'

const path = window.location.pathname.replace(/\/+$/, '')

let page: 'app' | 'return' | 'live' | 'redirect' = 'app'
if (path === '/retorno' || path === '/view') {
  page = 'return'
} else if (path === '/live') {
  page = 'live'
}

if (path === '/view') {
  window.location.replace('/retorno')
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {page === 'return' ? <View /> : page === 'live' ? <Live /> : <App />}
    </StrictMode>
  )
}
