import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-start justify-center gap-4 p-8">
      <h2 className="font-heading text-2xl font-bold">Página no encontrada</h2>
      <p className="text-sm text-muted-foreground">
        Esa ruta no existe en Riff Journey.
      </p>
      <Link
        href="/dashboard"
        className={cn(buttonVariants({ variant: "default" }))}
      >
        Volver al inicio
      </Link>
    </div>
  );
}
