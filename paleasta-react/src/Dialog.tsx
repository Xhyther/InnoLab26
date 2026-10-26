import { createPortal } from "react-dom";
import { useEffect,useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "./ui";
export function Details({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const root=document.getElementById("root");
    if(root)root.inert=true;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("button")?.focus();
    function keyboard(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab") return;
      const controls = panel.current?.querySelectorAll<HTMLElement>(
        "button, input, select, textarea, a[href]",
      );
      const first = controls?.[0],
        last = controls?.[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", keyboard);
    return () => {
      document.body.style.overflow = overflow;
      if(root)root.inert=false;
      document.removeEventListener("keydown", keyboard);
      previous?.focus();
    };
  }, [onClose]);
  return createPortal(
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <section
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="card my-auto w-full max-w-xl"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2>{title}</h2>
          <Button variant="ghost" aria-label="Close details" onClick={onClose}>
            ×
          </Button>
        </div>
        {children}
        <Button className="mt-6" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </section>
    </div>,document.body
  );
}