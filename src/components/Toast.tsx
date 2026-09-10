import { useEffect } from "react";
import { useGameStore } from "../game/store";

const TOAST_DURATION_MS = 2200;

export function Toast() {
  const toastMessage = useGameStore((s) => s.toastMessage);
  const showToast = useGameStore((s) => s.showToast);

  useEffect(() => {
    if (!toastMessage) return;
    const id = window.setTimeout(() => showToast(""), TOAST_DURATION_MS);
    return () => window.clearTimeout(id);
  }, [toastMessage, showToast]);

  return <div id="log-toast">{toastMessage}</div>;
}
