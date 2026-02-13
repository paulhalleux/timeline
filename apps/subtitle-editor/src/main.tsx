import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.tsx";
import { TimelineInstanceProvider } from "./components/timeline";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TimelineInstanceProvider>
      <App />
    </TimelineInstanceProvider>
  </StrictMode>,
);
