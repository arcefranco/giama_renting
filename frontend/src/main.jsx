import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import {BrowserRouter} from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux';
import { store } from '../store.js';
import { locale } from 'devextreme/localization';
import { loadMessages } from 'devextreme/localization';
import * as messagesEs from 'devextreme/localization/messages/es.json';




loadMessages(messagesEs); // Cargar traducciones a español

locale('es');

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  </Provider>
  )
