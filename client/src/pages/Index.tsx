
import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import FileUploadZone from '@/components/FileUploadZone';
import RedactionMethodSelect from '@/components/RedactionMethodSelect';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [method, setMethod] = useState('full_redact');
  const [replaceText, setReplaceText] = useState('[REDACTED]');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      toast({
        variant: "destructive",
        title: "No files selected",
        description: "Please select at least one PDF or DOCX file to process",
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      formData.append('method', method);
      if (method === 'replace') {
        formData.append('replace_text', replaceText);
      }

      const response = await fetch('http://localhost:5000/redact', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process files');
      }

      const disposition = response.headers.get('content-disposition');
      const filenameRegex = /filename[^;=\n]=((['"]).?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition || '');
      let filename = 'redacted_files.zip';
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success!",
        description: "Your files have been processed and downloaded",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">AI Document Redaction</h1>
          <p className="text-muted-foreground">
            Upload your documents and let AI handle the sensitive information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-card rounded-xl shadow-sm p-6 space-y-6 text-card-foreground">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Upload Files</h2>
              <FileUploadZone files={files} onFileChange={setFiles} />
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Select Redaction Method</h2>
              <RedactionMethodSelect selected={method} onSelect={setMethod} />
            </div>

            {method === 'replace' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Replacement Text</h2>
                <Input
                  type="text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder="Enter text to replace sensitive information"
                  className="max-w-md"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process Documents'
              )}
            </Button>
          </div>
        </form>

        <div className="mt-8 bg-accent border border-accent rounded-xl p-6">
          <h3 className="text-lg font-semibold text-accent-foreground mb-4">How It Works</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "1", text: "Upload your documents" },
              { step: "2", text: "Choose redaction method" },
              { step: "3", text: "Process files" },
              { step: "4", text: "Download redacted documents" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground font-medium">
                  {item.step}
                </div>
                <p className="text-accent-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
