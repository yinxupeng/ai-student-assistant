import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "antd/dist/reset.css";
import "./styles.css";

const rootElement = document.getElementById("root");

function showRuntimeError(error) {
  if (!rootElement) return;
  rootElement.innerHTML = `<pre style="margin:24px;padding:16px;border:1px solid #ffd6d6;border-radius:8px;background:#fff1f0;color:#a8071a;white-space:pre-wrap;">${String(error?.stack || error?.message || error)}</pre>`;
}

window.addEventListener("error", (event) => showRuntimeError(event.error || event.message));
window.addEventListener("unhandledrejection", (event) => showRuntimeError(event.reason));

try {
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} catch (error) {
  showRuntimeError(error);
}
