import { createRoot } from "react-dom/client";
import "./index.css";
import { HashRouter } from "react-router-dom";
import App from "./App";
import SidebarApp from "./pages/SidebarApp"

const isExtension = window.location.protocol === "chrome-extension:";

createRoot(document.getElementById("root")!).render(
  isExtension ? (
    <SidebarApp />
  ) : (
    <HashRouter>
      <App />
    </HashRouter>
  )
);