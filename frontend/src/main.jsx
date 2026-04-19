import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// ✅ charge ton style global
import "./styles/global.css";

// (optionnel) garde si tu en as besoin
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);