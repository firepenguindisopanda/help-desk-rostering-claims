"use client";

import { Banner } from "./ui/banner";

type ErrorsMap = Record<string, unknown> | undefined;

export function FormErrorSummary({ errors }: { readonly errors: ErrorsMap }) {
  if (!errors || Object.keys(errors).length === 0) return null;
  const entries = Object.entries(errors);
  return (
    <Banner variant="error" message="Please review the highlighted fields.">
      <ul className="list-disc pl-5 space-y-1">
        {entries.map(([field, detail]) => (
          <li key={field}>
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={() => {
                const el = document.querySelector(`[name="${field}"]`);
                if (el instanceof HTMLElement) {
                  el.focus();
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
            >
              {field}
            </button>
            {": "}
            <span>{Array.isArray(detail) ? detail.join(", ") : String(detail)}</span>
          </li>
        ))}
      </ul>
    </Banner>
  );
}
