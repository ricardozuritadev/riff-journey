"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getDb } from "@/data/db";
import { ensureSeedData } from "@/data/seed/run-seed";

type DbStatus = "loading" | "ready" | "error";

interface DbContextValue {
  status: DbStatus;
  error: string | null;
  retry: () => void;
}

const DbContext = createContext<DbContextValue | null>(null);

export function DbProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<DbStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setStatus("loading");
      setError(null);
      try {
        const db = getDb();
        await db.open();
        await ensureSeedData();

        if (typeof navigator !== "undefined" && navigator.storage?.persist) {
          void navigator.storage.persist();
        }

        if (!cancelled) {
          setStatus("ready");
        }
      } catch (err) {
        if (!cancelled) {
          setStatus("error");
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo abrir la base de datos local.",
          );
        }
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  return (
    <DbContext.Provider
      value={{
        status,
        error,
        retry: () => setAttempt((n) => n + 1),
      }}
    >
      {children}
    </DbContext.Provider>
  );
}

export function useDb(): DbContextValue {
  const ctx = useContext(DbContext);
  if (!ctx) {
    throw new Error("useDb debe usarse dentro de DbProvider.");
  }
  return ctx;
}
