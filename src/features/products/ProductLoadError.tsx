import { Link } from "@tanstack/react-router";
import { CircleAlert } from "lucide-react";
import { ProductApiError } from "./types";

export function ProductLoadError({ error }: Readonly<{ error: unknown }>) {
  const isNotFound = error instanceof ProductApiError && error.status === 404;

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 text-center shadow-sm">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <CircleAlert className="size-6" />
      </span>
      <h1 className="mt-4 text-xl font-semibold">
        {isNotFound ? "Product not found" : "Product could not be loaded"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {error instanceof Error ? error.message : "An unexpected error occurred."}
      </p>
      <Link
        to="/products"
        className="mt-6 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Return to Products
      </Link>
    </div>
  );
}
