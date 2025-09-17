import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import {BrowserRouter} from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux';
import { store, persistor } from '../store.js';
import { locale } from 'devextreme/localization';
import { loadMessages } from 'devextreme/localization';
import * as messagesEs from 'devextreme/localization/messages/es.json';
import { PersistGate } from 'redux-persist/integration/react';
const base = import.meta.env.REACT_APP_BASENAME || "/";


loadMessages(messagesEs); // Cargar traducciones a español

locale('es');

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
  <PersistGate loading={null} persistor={persistor}>
  <BrowserRouter basename={base}>
    <App />
  </BrowserRouter>
  </PersistGate>
  </Provider>
  )
