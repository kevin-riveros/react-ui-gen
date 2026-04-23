---
name: components
description: Reusable vanilla components (Button, Card, Input, Modal) built with Tailwind.
---

# Vanilla Components

Drop these into `/components/ui/` and reuse them. They use Tailwind only.

## Button

```jsx
export const Button = ({ variant = "primary", className = "", children, ...props }) => {
  const base = "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};
```

## Card

```jsx
export const Card = ({ className = "", children }) => (
  <div className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}>{children}</div>
);
```

## Input

```jsx
export const Input = ({ label, error, className = "", ...props }) => (
  <label className="block">
    {label && <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>}
    <input
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${error ? "border-red-500" : ""} ${className}`}
      {...props}
    />
    {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
  </label>
);
```

## Modal (basic)

```jsx
export const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
        {children}
      </div>
    </div>
  );
};
```

Build custom variants (sizes, icons, loading states) as you need them — don't over-abstract.
