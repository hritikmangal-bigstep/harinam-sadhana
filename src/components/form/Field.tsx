import { cn } from "@/lib/utils";

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  helper?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

/** §7.4 Form field shell: visible label, required marker, helper + error text. */
export function Field({
  id,
  label,
  required,
  helper,
  error,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className="font-body text-body-sm font-medium text-heading"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-primary">
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-caption text-error"
        >
          {error}
        </p>
      ) : helper ? (
        <p id={`${id}-helper`} className="text-caption text-muted">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

/** Shared input styling (§7.4): 48px, saffron focus glow, error border. */
export const inputClass =
  "h-12 w-full rounded-sm border-[1.5px] border-border bg-surface px-4 font-body text-body text-foreground placeholder:text-muted/70 transition-shadow focus:border-primary focus:outline-none focus:shadow-[0_0_0_3px_var(--color-primary-light)] aria-[invalid=true]:border-error";
