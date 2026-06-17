import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@/components/app/app";
import "@/index.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Editor root element was not found.");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
