import React from 'react';
import ReactDOM from 'react-dom/client';
import { PopoutTimer } from './components/PopoutTimer';
import './index.css';

ReactDOM.createRoot(document.getElementById('popout-root')!).render(
  <React.StrictMode>
    <div className="antialiased">
      <PopoutTimer />
    </div>
  </React.StrictMode>,
); 