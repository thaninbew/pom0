import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './components/Terminal.css';
import { TerminalPopout } from './components/TerminalPopout';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TerminalPopout />
  </React.StrictMode>,
); 