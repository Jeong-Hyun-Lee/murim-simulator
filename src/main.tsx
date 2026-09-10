import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./style.css";

const root = document.querySelector<HTMLDivElement>("#root")!;
createRoot(root).render(<App />);
