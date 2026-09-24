"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Minus, Plus } from "lucide-react";
import "react-easy-crop/react-easy-crop.css";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cropImageToJpeg } from "@/lib/crop-image";
import { imxToast } from "@/lib/imx-toast";
import { cn } from "@/lib/utils";

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.05;

type AvatarCropDialogProps = {
  imageSrc: string | null;
  open: boolean;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (file: File) => void | Promise<void>;
};

export function AvatarCropDialog({
  imageSrc,
  open,
  pending = false,
  onOpenChange,
  onSave,
}: AvatarCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  /** Wait a frame so the dialog has real layout before Cropper measures. */
  const [stageReady, setStageReady] = useState(false);

  useEffect(() => {
    if (!open || !imageSrc) {
      setStageReady(false);
      return;
    }
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setSaving(false);
    setStageReady(false);
    let cancelled = false;
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!cancelled) setStageReady(true);
      });
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(id);
    };
  }, [open, imageSrc]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleSave() {
    if (!imageSrc || !croppedAreaPixels || saving || pending) return;
    setSaving(true);
    try {
      const blob = await cropImageToJpeg(imageSrc, croppedAreaPixels);
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      await onSave(file);
    } catch {
      imxToast("Couldn’t crop that photo", { tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  const busy = saving || pending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy && !next) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton={!busy}
        className="imx-surface-float gap-0 overflow-hidden border-surface-border p-0 sm:max-w-md"
        onPointerDownOutside={(e) => {
          if (busy) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <DialogHeader className="border-b border-border/40 px-5 pb-4 pt-5 pr-12">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Profile photo
          </p>
          <DialogTitle className="mt-1.5 text-lg">Adjust your photo</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Drag to reposition · scroll or use the slider to zoom.
          </DialogDescription>
        </DialogHeader>

        <div
          className="relative h-72 w-full shrink-0 bg-black/80 sm:h-80"
          style={{ minHeight: 288 }}
        >
          {stageReady && imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              objectFit="cover"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              minZoom={ZOOM_MIN}
              maxZoom={ZOOM_MAX}
              zoomSpeed={0.4}
              style={{
                containerStyle: {
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                },
                cropAreaStyle: {
                  color: "rgba(0, 0, 0, 0.55)",
                },
              }}
            />
          ) : (
            <div className="absolute inset-0 animate-pulse bg-muted/30" aria-hidden />
          )}
        </div>

        <div className="space-y-4 border-t border-border/40 px-5 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={busy || zoom <= ZOOM_MIN}
              aria-label="Zoom out"
              onClick={() =>
                setZoom((z) =>
                  Math.max(ZOOM_MIN, +(z - ZOOM_STEP * 4).toFixed(2)),
                )
              }
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <input
              type="range"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={ZOOM_STEP}
              value={zoom}
              disabled={busy}
              aria-label="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className={cn(
                "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-foreground",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            />
            <button
              type="button"
              disabled={busy || zoom >= ZOOM_MAX}
              aria-label="Zoom in"
              onClick={() =>
                setZoom((z) =>
                  Math.min(ZOOM_MAX, +(z + ZOOM_STEP * 4).toFixed(2)),
                )
              }
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={busy || !croppedAreaPixels}
              onClick={() => void handleSave()}
            >
              {busy ? "Saving…" : "Save photo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
