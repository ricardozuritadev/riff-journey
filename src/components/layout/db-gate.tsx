"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDb } from "@/hooks/use-db";

export function DbGate({ children }: { children: React.ReactNode }) {
  const { status, error, retry } = useDb();

  if (status === "loading") {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <p className="text-sm text-muted-foreground">
          Preparando tu viaje musical…
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-1 flex-col items-start justify-center gap-4 p-6">
        <h2 className="font-heading text-xl font-semibold">
          No se pudo cargar los datos
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {error ??
            "IndexedDB no está disponible. Prueba salir del modo privado o permite almacenamiento al sitio."}
        </p>
        <Button type="button" onClick={retry}>
          Reintentar
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
