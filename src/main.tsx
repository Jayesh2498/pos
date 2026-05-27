import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { initIframeReady, notifyAppReady, notifyAppError } from './lib/iframe-ready-notification'
import { ThemeProvider } from './lib/theme'
import { ActiveStoreProvider } from './lib/active-store'
import { AuthProvider } from './lib/auth'

initIframeReady()

const rootElement = document.getElementById('root')

if (!rootElement) {
  console.error('[Coder] Root element not found')
  notifyAppError('root_not_found')
} else {
  try {
    const root = createRoot(rootElement)

    root.render(
      <StrictMode>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <ActiveStoreProvider>
                <App />
              </ActiveStoreProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </StrictMode>,
    )

    notifyAppReady()
  } catch (err) {
    console.error('[Coder] React render failed:', err)
    notifyAppError('render_failure', {
      message: err instanceof Error ? err.message : String(err),
    })
  }
}
