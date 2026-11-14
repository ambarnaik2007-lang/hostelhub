import { Camera, CameraOff, ImageUp, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type ScannerInstance = {
  start: (...args: unknown[]) => Promise<unknown>;
  stop: () => Promise<void>;
  clear: () => void;
  isScanning: boolean;
  scanFile: (f: File, showImage?: boolean) => Promise<string>;
};

/** Camera QR scanner. The scanning library is loaded on demand in the browser only. */
export function QrScanner({ onResult }: { onResult: (text: string) => void }) {
  const scannerRef = useRef<ScannerInstance | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "starting" | "running" | "error">("idle");
  const [error, setError] = useState("");
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const stop = async () => {
    const s = scannerRef.current;
    if (s?.isScanning) {
      try {
        await s.stop();
        s.clear();
      } catch {
        /* already stopped */
      }
    }
    setState("idle");
  };

  useEffect(() => () => void stop(), []);

  const start = async () => {
    setError("");
    setState("starting");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (!scannerRef.current) scannerRef.current = new Html5Qrcode("hp-qr-reader") as unknown as ScannerInstance;
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        (text: string) => {
          void stop();
          onResultRef.current(text);
        },
        () => {},
      );
      setState("running");
    } catch (e) {
      setState("error");
      setError(
        (e as Error)?.message?.includes("Permission") || String(e).includes("NotAllowed")
          ? "Camera permission was denied. Allow camera access, or use manual entry / image upload."
          : "Could not start the camera. Open the app in its own browser tab, or use manual entry / image upload.",
      );
    }
  };

  const scanImage = async (file: File) => {
    setError("");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const s = new Html5Qrcode("hp-qr-file") as unknown as ScannerInstance;
      const text = await s.scanFile(file, false);
      onResultRef.current(text);
    } catch {
      setError("No QR code found in that image.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-sidebar">
        <div id="hp-qr-reader" className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />
        {state !== "running" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-sidebar-foreground">
            <div className="relative h-40 w-40 rounded-2xl border-2 border-dashed border-sidebar-primary/60">
              <div className="absolute inset-0 flex items-center justify-center">
                {state === "starting" ? (
                  <Loader2 className="h-8 w-8 animate-spin text-sidebar-primary" />
                ) : (
                  <Camera className="h-8 w-8 text-sidebar-primary" />
                )}
              </div>
            </div>
            <p className="text-sm text-sidebar-muted">Point the camera at the student's QR pass</p>
          </div>
        )}
      </div>
      <div id="hp-qr-file" className="hidden" />
      {error && <p className="rounded-lg bg-destructive-soft p-3 text-xs text-destructive">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        {state === "running" ? (
          <Button variant="outline" onClick={() => void stop()}>
            <CameraOff /> Stop camera
          </Button>
        ) : (
          <Button onClick={() => void start()} disabled={state === "starting"}>
            <Camera /> Start camera
          </Button>
        )}
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <ImageUp /> Upload QR image
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void scanImage(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
