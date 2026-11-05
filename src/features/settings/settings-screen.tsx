"use client";

import { useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { getDb } from "@/data/db";
import {
  exportBackup,
  importBackup,
} from "@/data/import-export/backup";
import { CURRENT_SEED_VERSION } from "@/data/seed/ids";
import { formatDate } from "@/lib/dates";

export function SettingsScreen() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [persistStatus, setPersistStatus] = useState<string | null>(null);

  const settings = useLiveQuery(() => getDb().app_settings.get("default"));

  async function handleExport() {
    try {
      const payload = await exportBackup();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = payload.exportedAt.slice(0, 10);
      a.href = url;
      a.download = `riff-journey-backup-${stamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Copia exportada");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo exportar",
      );
    }
  }

  function handleImportPick(file: File | null) {
    if (!file) return;
    setPendingFile(file);
    setImportOpen(true);
  }

  async function confirmImport() {
    if (!pendingFile) return;
    try {
      const text = await pendingFile.text();
      const raw: unknown = JSON.parse(text);
      await importBackup(raw);
      toast.success("Datos importados correctamente");
      setImportOpen(false);
      setPendingFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "El archivo no es un backup válido",
      );
    }
  }

  async function handlePersist() {
    try {
      if (!navigator.storage?.persist) {
        setPersistStatus("Tu navegador no soporta almacenamiento persistente.");
        return;
      }
      const granted = await navigator.storage.persist();
      setPersistStatus(
        granted
          ? "Almacenamiento persistente concedido."
          : "El navegador no concedió persistencia (puede borrar datos bajo presión).",
      );
      toast.success(
        granted ? "Persistencia activada" : "Persistencia no concedida",
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "No se pudo solicitar persistencia",
      );
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ajustes"
        description="Copia de seguridad, almacenamiento y datos iniciales."
      />

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">
          Copia de seguridad
        </h2>
        <p className="text-sm text-muted-foreground">
          Exporta todos tus datos a un archivo JSON o restaura una copia. La
          importación reemplaza por completo los datos actuales.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void handleExport()}>Exportar JSON</Button>
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
          >
            Importar JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) =>
              handleImportPick(e.target.files?.[0] ?? null)
            }
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Almacenamiento</h2>
        <p className="text-sm text-muted-foreground">
          Solicita al navegador que conserve IndexedDB aunque el disco esté
          lleno.
        </p>
        <Button variant="outline" onClick={() => void handlePersist()}>
          Solicitar almacenamiento persistente
        </Button>
        {persistStatus ? (
          <p className="text-sm text-muted-foreground">{persistStatus}</p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Seed / datos</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4 border-t border-border pt-2">
            <dt className="text-muted-foreground">Versión de seed actual</dt>
            <dd className="tabular-nums">{CURRENT_SEED_VERSION}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-2">
            <dt className="text-muted-foreground">Seed aplicada</dt>
            <dd className="tabular-nums">
              {settings?.seedVersion ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-2">
            <dt className="text-muted-foreground">Locale</dt>
            <dd>{settings?.locale ?? "es"}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-border pt-2">
            <dt className="text-muted-foreground">Actualizado</dt>
            <dd>
              {settings?.updatedAt
                ? formatDate(settings.updatedAt, "d MMM yyyy · HH:mm")
                : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <AlertDialog open={importOpen} onOpenChange={setImportOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reemplazar todos los datos?</AlertDialogTitle>
            <AlertDialogDescription>
              La importación borrará bandas, canciones y sesiones actuales y las
              sustituirá por el contenido de{" "}
              <strong>{pendingFile?.name ?? "el archivo"}</strong>. No se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setPendingFile(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void confirmImport()}
            >
              Importar y reemplazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
