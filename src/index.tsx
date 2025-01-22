import React from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';
import App from './App';
// import reportWebVitals from './reportWebVitals';

const container = document.getElementById("app");
if (container) {
  
  const root = createRoot(container);
  root.render(<App />);
  
} else {
  console.error("Could not find the root element to mount the app.");
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
