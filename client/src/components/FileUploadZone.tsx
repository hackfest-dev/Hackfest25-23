
import React from 'react';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  files: File[];
  onFileChange: (files: File[]) => void;
}

const FileUploadZone = ({ files, onFileChange }: FileUploadZoneProps) => {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    onFileChange(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    onFileChange(selectedFiles);
  };

  const removeFile = (indexToRemove: number) => {
    onFileChange(files.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="w-full space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8",
          "transition-all duration-200",
          "flex flex-col items-center justify-center gap-4",
          "bg-muted hover:bg-muted/80",
          files.length === 0 ? "border-muted-foreground/30" : "border-primary/50"
        )}
      >
        <Upload className="w-12 h-12 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            Drag and drop your files here, or{" "}
            <label className="text-primary hover:text-primary/80 cursor-pointer">
              browse
              <input
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.docx"
                onChange={handleFileInput}
              />
            </label>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports PDF and DOCX files
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-card rounded-lg border p-4 space-y-2 text-card-foreground">
          <h3 className="text-sm font-medium text-foreground">Selected Files</h3>
          <div className="divide-y divide-border">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-2">
                  <File className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{file.name}</span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;
