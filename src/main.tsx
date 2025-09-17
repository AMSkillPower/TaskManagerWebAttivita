import React from 'react'
import ReactDOM from 'react-dom/client'
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, RouterProvider } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import App from './App'
import './index.css'
import { RootComponent } from './components/RootComponent'

// Crea un componente wrapper che include il provider
const AppWrapper = () => (
  <AppProvider>
    <App />
  </AppProvider>
)

const root = createRoot(document.getElementById('root')!);


root.render(
  <StrictMode>
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  </StrictMode>
);