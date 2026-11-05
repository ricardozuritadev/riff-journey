"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-full flex-col items-start justify-center gap-4 p-8">
      <h2 className="font-heading text-2xl font-bold">Algo salió mal</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || "Ha ocurrido un error inesperado."}
      </p>
      <Button type="button" onClick={reset}>
        Intentar de nuevo
      </Button>
    </div>
  );
}
