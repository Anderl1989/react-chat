import React from 'react';
import ReactDOM from 'react-dom/client';

// This is for materialUI, so fonts work properly, see https://mui.com/material-ui/getting-started/installation/#roboto-font
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

// Import pages we might route to
import Chat from './pages/Chat.jsx';

// Import global styles
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Chat />
  </React.StrictMode>,
);
