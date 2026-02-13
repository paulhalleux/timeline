import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.tsx";
import { TimelinePanelProvider } from "./Timeline.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TimelinePanelProvider>
      <App />
    </TimelinePanelProvider>
  </StrictMode>,
);
