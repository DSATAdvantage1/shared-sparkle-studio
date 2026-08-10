import React from "react";

export function PdfImportDropzone({
  onFile,
  disabled,
  label = "Drop a PDF here",
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
  label?: string;
}) {
  const [dragOver, setDragOver] = React.useState(false);

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        if (disabled) return;
        setDragOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (disabled) return;
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        if (disabled) return;
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className={
        "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition " +
        (dragOver
          ? "border-primary/60 bg-primary/5"
          : "border-border bg-card/40 hover:bg-card")
      }
      aria-disabled={disabled}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-2 text-xs text-muted-foreground">
        PDF only • Multi-page supported
      </div>
    </div>
  );
}
