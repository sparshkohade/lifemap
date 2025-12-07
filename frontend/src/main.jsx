import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { BrowserRouter } from 'react-router-dom'; // 1. Import the router
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter> {/* 2. Wrap your ThemeProvider */}
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter> {/* 3. Close the wrapper */}
  </React.StrictMode>
);