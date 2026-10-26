import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { asset } from "./navigation";

const iconFiles: Record<string, [string, string?]> = {
  overview: ["ff5a5.svg", "67749.svg"],
  adviser: ["af8db.svg", "5b2c8.svg"],
  transactions: ["b97b3.svg", "7c89a.svg"],
  inventory: ["7f6e4.svg", "8709f.svg"],
  passport: ["6a127.svg", "ff668.svg"],
  settings: ["64313.svg", "92f25.svg"],
  help: ["20029.svg"],
  record: ["9a4ef.svg"],
  close: ["63f91.svg"],

  balance: ["82a14.svg"],
  entries: ["4b270.svg"],
  receipt: ["02f2d.svg"],
  owner: ["79c3b.svg"],
  camera: ["24521.svg"],
  check: ["eac5c.svg"],
  plus: ["4197d.svg"],
  bell: ["31c32.svg"],
  search: ["49324.svg"],
};
export function Icon({
  name,
  active = false,
}: {
  name: string;
  active?: boolean;
}) {
  if (name === "inflow" || name === "outflow") {
    return (
      <span
        className={`icon-slot ${active ? "text-white" : name === "outflow" ? "text-outflow" : "text-primary"}`}
        aria-hidden="true"
      >
        <svg
          data-cash-direction={name}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3v18h18" />
          {name === "inflow" ? (
            <>
              <path d="m3 14 5-5 4 4 7-7" />
              <path d="M14 6h5v5" />
            </>
          ) : (
            <>
              <path d="m3 6 5 5 4-4 7 7" />
              <path d="M14 14h5V9" />
            </>
          )}
        </svg>
      </span>
    );
  }

  const files = iconFiles[name] ?? iconFiles.record;
  return (
    <span className="icon-slot" aria-hidden="true">
      <img src={asset(active && files[1] ? files[1] : files[0])} alt="" />
    </span>
  );
}
export function Lea({
  size = 40,
  className = "",
}: {
  size?: 40 | 48 | 64 | 88 | 96 | 164 | 240;
  className?: string;
}) {
  const files = {
    40: "805dd.svg",
    48: "192a0.svg",
    64: "fecf8.svg",
    88: "a2d5a.svg",
    96: "a8735.svg",
    164: "eefac.svg",
    240: "d1822.svg",
  };
  return (
    <img
      className={`lea shrink-0 ${className}`}
      src={asset(files[size])}
      alt="LEA, a friendly green leaf creature"
    />
  );
}
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark" aria-hidden="true">
        <img className="mark-base" src={asset("123e5.svg")} alt="" />
        <span className="mark-leaf">
          <img src={asset("8e032.svg")} alt="" />
        </span>
      </span>
      <span>
        Pa<span className="text-primary">LEA</span>sta!
      </span>
    </span>
  );
}
export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "white";
}) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}
export function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>;
}
export function Field({
  label,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}
export function Select({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select {...props}>{children}</select>
    </label>
  );
}
export function PageTitle({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1>{title}</h1>
        <p className="mt-2 text-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Stat({
  label,
  subtitle,
  value,
  caption,
  icon,
}: {
  label: string;
  subtitle?: string;
  value: string;
  caption: string;
  icon?: string;
}) {
  return (
    <Card className={`stat ${icon === "outflow" ? "stat-outflow" : ""}`}>
      <div className="stat-heading">
        <div>
          <p className="eyebrow">{label}</p>
          {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
        </div>
        {icon && (
          <span className="icon-badge">
            <Icon name={icon} />
          </span>
        )}
      </div>
      <p className="stat-value">{value}</p>
      <p className="stat-caption">{caption}</p>
    </Card>
  );
}
