import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getExportStatus, submitExport } from "./api";
import { formatExportErrorMessage } from "./apiError";
import { downloadExportFile } from "./download";
import type { CreateExportRequest, ExportStatus, ExportStatusResponse } from "./types";

export function useSubmitExport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateExportRequest) => submitExport(request),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["myExports"] });
    },
  });
}

export function useExportStatus(exportId: string | null) {
  return useQuery({
    queryKey: ["exportStatus", exportId],
    queryFn: () => getExportStatus(exportId!),
    enabled: Boolean(exportId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 2000;
      if (data.status === "Ready" || data.status === "Failed" || data.status === "Expired") {
        return false;
      }
      return 3000;
    },
  });
}

export type RunExportPhase = "idle" | "Queued" | "Running" | "Downloading";

const FIVE_MINUTES_MS = 300_000;

export function useRunExport() {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<RunExportPhase>("idle");
  const isPendingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const runExport = useCallback(
    async (request: CreateExportRequest): Promise<void> => {
      if (isPendingRef.current) return;
      isPendingRef.current = true;
      setPhase("Queued");

      try {
        const accepted = await submitExport(request);
        void queryClient.invalidateQueries({ queryKey: ["myExports"] });

        const startTime = Date.now();
        let delay = 1500;
        let latestStatus: ExportStatusResponse | null = null;

        while (mountedRef.current) {
          if (Date.now() - startTime > FIVE_MINUTES_MS) {
            toast.info("This is taking longer than usual. You can find it in My exports.");
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, delay));
          if (!mountedRef.current) break;

          latestStatus = await getExportStatus(accepted.exportId);
          if (!mountedRef.current) break;

          const status: ExportStatus = latestStatus.status;
          if (status === "Running") {
            setPhase("Running");
          } else if (status === "Ready") {
            setPhase("Downloading");
            await downloadExportFile(accepted.exportId, {
              fallbackFormat: request.format,
            });
            toast.success("Export ready and downloaded.");
            void queryClient.invalidateQueries({ queryKey: ["myExports"] });
            break;
          } else if (status === "Failed") {
            toast.error(latestStatus.error ?? "Export generation failed.");
            void queryClient.invalidateQueries({ queryKey: ["myExports"] });
            break;
          } else if (status === "Expired") {
            toast.error("This export has expired and its file was removed.");
            void queryClient.invalidateQueries({ queryKey: ["myExports"] });
            break;
          }

          delay = Math.min(delay + 1000, 5000);
        }
      } catch (err) {
        if (mountedRef.current) {
          toast.error(formatExportErrorMessage(err));
        }
      } finally {
        if (mountedRef.current) {
          setPhase("idle");
        }
        isPendingRef.current = false;
      }
    },
    [queryClient],
  );

  return {
    runExport,
    phase,
    isPending: phase !== "idle",
  };
}
