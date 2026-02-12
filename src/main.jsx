import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { ToastProvider } from './components/Toast'
import { InsforgeProvider } from './hooks/useInsforge'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <HashRouter>
            <ToastProvider>
                <InsforgeProvider>
                    <App />
                </InsforgeProvider>
            </ToastProvider>
        </HashRouter>
    </React.StrictMode>
)
