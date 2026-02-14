import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.tsx";
import { TimelineInstanceProvider } from "./components/timeline";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TimelineInstanceProvider
      config={{
        minVisibleRange: 1000 * 30,
        maxVisibleRange: 1000 * 60 * 60,
      }}
    >
      <App />
    </TimelineInstanceProvider>
  </StrictMode>,
);
