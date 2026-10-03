import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { defineCustomElements as defineJeepSqlite } from "jeep-sqlite/loader";
import App from "./App.tsx";
import "./index.css";

if (Capacitor.getPlatform() === "web") {
  defineJeepSqlite(window);
  if (!document.querySelector("jeep-sqlite")) {
    const el = document.createElement("jeep-sqlite");
    document.body.appendChild(el);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
