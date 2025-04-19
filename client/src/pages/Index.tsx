import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import FileUploadZone from "@/components/FileUploadZone";
import RedactionMethodSelect from "@/components/RedactionMethodSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, FileText, Download, Database, Mail } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface Document {
  path: string;
  email: string;
  hash: string | null;
  filename: string;
  processed: boolean;
}

interface StructuredResult {
  path: string;
  filename: string;
  email: string;
  hash: string;
  structured_data: Record<string, unknown>;
  error?: string;
}

const Index = () => {
  // State for document upload
  const [files, setFiles] = useState<File[]>([]);
  const [email, setEmail] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // State for document list
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [emailFilter, setEmailFilter] = useState("");

  // State for redaction
  const [method, setMethod] = useState("full_redact");
  const [replaceText, setReplaceText] = useState("[REDACTED]");
  const [isRedacting, setIsRedacting] = useState(false);

  // State for structured data extraction
  const [isProcessingStructured, setIsProcessingStructured] = useState(false);
  const [structuredResults, setStructuredResults] = useState<StructuredResult[]>([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    // Load documents when the component mounts or email filter changes
    fetchDocuments();
  }, [emailFilter]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const url = emailFilter
        ? `http://localhost:5000/documents?email=${encodeURIComponent(
            emailFilter
          )}`
        : "http://localhost:5000/documents";

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
        mode: "cors",
        credentials: "omit",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching documents",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      toast({
        variant: "destructive",
        title: "No files selected",
        description: "Please select at least one PDF file to upload",
      });
      return;
    }

    if (!email) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload each file one by one
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("email", email);

        const response = await fetch("http://localhost:5000/document/add", {
          method: "POST",
          mode: "cors",
          credentials: "omit",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to upload file");
        }
      }

      toast({
        title: "Success!",
        description: "Documents uploaded successfully",
      });

      // Reset form and refresh document list
      setFiles([]);
      fetchDocuments();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Upload Error",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentSelect = (path: string) => {
    setSelectedDocuments((prev) => {
      if (prev.includes(path)) {
        return prev.filter((p) => p !== path);
      } else {
        return [...prev, path];
      }
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(documents.map((doc) => doc.path));
    } else {
      setSelectedDocuments([]);
    }
  };

  const handleProcessStructured = async () => {
    if (selectedDocuments.length === 0) {
      toast({
        variant: "destructive",
        title: "No documents selected",
        description: "Please select at least one document to process",
      });
      return;
    }

    setIsProcessingStructured(true);

    try {
      const response = await fetch("http://localhost:5000/structured", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        mode: "cors",
        credentials: "omit",
        body: JSON.stringify({
          document_paths: selectedDocuments,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process documents");
      }

      const results = await response.json();
      setStructuredResults(results);

      // Create and download JSON file with the results
      const jsonData = JSON.stringify(results, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `structured_data_${new Date().getTime()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success!",
        description: `Processed ${results.length} documents. JSON downloaded.`,
      });

      // Refresh document list to show updated status
      fetchDocuments();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Processing Error",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
      });
    } finally {
      setIsProcessingStructured(false);
    }
  };

  const handleRedactDocuments = async () => {
    if (selectedDocuments.length === 0) {
      toast({
        variant: "destructive",
        title: "No documents selected",
        description: "Please select at least one document to redact",
      });
      return;
    }

    setIsRedacting(true);

    try {
      // For redaction, we need to create a FormData with the actual files
      // We'll need to fetch each file by path first
      const formData = new FormData();

      for (const path of selectedDocuments) {
        // Get the document from our local state
        const doc = documents.find((d) => d.path === path);
        if (!doc) continue;

        // Try to fetch the file using the hash if available
        if (doc.hash) {
          const response = await fetch(
            `http://localhost:5000/document/hash/${doc.hash}`,
            {
              method: "GET",
              mode: "cors",
              credentials: "omit",
            }
          );
          if (response.ok) {
            const blob = await response.blob();
            const file = new File([blob], doc.filename, {
              type: "application/pdf",
            });
            formData.append("files", file);
          }
        }
      }

      formData.append("method", method);
      formData.append("email", email || emailFilter);
      if (method === "replace") {
        formData.append("replace_text", replaceText);
      }

      const response = await fetch("http://localhost:5000/redact", {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to redact files");
      }

      // Handle zip file download
      const disposition = response.headers.get("content-disposition");
      const filenameRegex = /filename[^;=\n]=((['"]).?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition || "");
      let filename = "redacted_files.zip";
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, "");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success!",
        description: "Your files have been redacted and downloaded",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Redaction Error",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
      });
    } finally {
      setIsRedacting(false);
    }
  };

  const handleSendEmail = async (email: string, filename: string) => {
    setIsSendingEmail(true);
    try {
      // Clean up the filename by removing the UUID prefix if present
      const cleanFilename = filename.replace(/^[a-f0-9-]+_/, '');
      
      // Format the email subject and content
      const subject = `Document Verification Request: ${cleanFilename}`;
      
      // Create a properly formatted HTML email template with inline styles
      // Email clients require inline styles and simple HTML structure
      const contents = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Verification Request</title>
</head>
<body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 30px auto; padding: 0; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
    <!-- Header -->
    <div style="padding: 30px; text-align: center; border-bottom: 1px solid #eaeaea;">
      <div style="width: 70px; height: 70px; margin: 0 auto 15px; background-color: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 32px;">📄</span>
      </div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #111827;">Document Verification</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px 40px;">
      <p style="font-size: 16px; margin-bottom: 25px;">Hello,</p>
      
      <p style="font-size: 16px; margin-bottom: 25px;">We need your verification for the following document:</p>
      
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <p style="font-weight: 600; font-size: 16px; color: #111827; margin: 0 0 5px 0;">${cleanFilename}</p>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">Please review this document carefully before verification.</p>
      </div>
      
      <p style="font-size: 16px; margin-bottom: 30px;">This document requires your verification before it can be processed in our system.</p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="#" style="display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 500; font-size: 16px;">Verify Document</a>
      </div>
      
      <p style="font-size: 14px; color: #6b7280; margin-top: 40px; border-top: 1px solid #eaeaea; padding-top: 20px;">
        If you did not request this verification, please disregard this email.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #eaeaea;">
      <p style="color: #6b7280; font-size: 12px; margin: 0;">© 2025 AI Document Management System</p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 5px;">This email was sent to ${email}</p>
    </div>
  </div>
</body>
</html>
`;

      console.log("Sending email to:", email);
      console.log("Subject:", subject);
      
      const response = await fetch("http://localhost:5000/email/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        mode: "cors",
        credentials: "omit",
        body: JSON.stringify({
          email,
          subject,
          contents,
        }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error("Email error response:", responseData);
        throw new Error(responseData.error || "Failed to send email");
      }

      toast({
        title: "Email Sent",
        description: `Verification email sent to ${email}`,
      });
    } catch (err) {
      console.error("Email error:", err);
      toast({
        variant: "destructive",
        title: "Email Error",
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            AI Document Management
          </h1>
          <p className="text-muted-foreground">
            Upload, manage, and process your documents with AI assistance
          </p>
        </div>

        <Tabs defaultValue="upload" className="space-y-8">
          <TabsList className="grid grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="manage">Manage</TabsTrigger>
            <TabsTrigger value="process">Process</TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus size={20} />
                  Add Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUploadDocument} className="space-y-6">
                  <div className="space-y-4">
                    <Label htmlFor="email">Your Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="max-w-md"
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Upload Files</Label>
                    <FileUploadZone files={files} onFileChange={setFiles} />
                  </div>

                  <Button
                    type="submit"
                    disabled={isUploading}
                    className="w-full md:w-auto"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload Documents"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Tab */}
          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={20} />
                  Document Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-end gap-4">
                    <div className="flex-1 max-w-xs">
                      <Label htmlFor="emailFilter">Filter by Email</Label>
                      <Input
                        id="emailFilter"
                        type="text"
                        value={emailFilter}
                        onChange={(e) => setEmailFilter(e.target.value)}
                        placeholder="Enter email to filter"
                        className="mt-1"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={fetchDocuments}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Refresh"
                      )}
                    </Button>
                  </div>

                  <div className="border rounded-md">
                    <div className="p-4 border-b bg-muted/50 flex items-center">
                      <div className="w-6 mr-2">
                        <Checkbox
                          id="selectAll"
                          checked={
                            selectedDocuments.length === documents.length &&
                            documents.length > 0
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </div>
                      <div className="flex-1 grid grid-cols-12 gap-4">
                        <div className="col-span-4 font-medium">Filename</div>
                        <div className="col-span-3 font-medium">Email</div>
                        <div className="col-span-3 font-medium">Status</div>
                        <div className="col-span-2 font-medium">Actions</div>
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {isLoading ? (
                        <div className="p-8 text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            Loading documents...
                          </p>
                        </div>
                      ) : documents.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-muted-foreground">
                            No documents found
                          </p>
                        </div>
                      ) : (
                        documents.map((doc) => (
                          <div
                            key={doc.path}
                            className="p-4 border-b flex items-center hover:bg-accent/10"
                          >
                            <div className="w-6 mr-2">
                              <Checkbox
                                id={`select-${doc.path}`}
                                checked={selectedDocuments.includes(doc.path)}
                                onCheckedChange={() =>
                                  handleDocumentSelect(doc.path)
                                }
                              />
                            </div>
                            <div className="flex-1 grid grid-cols-12 gap-4">
                              <div className="col-span-4 truncate">
                                {doc.filename}
                              </div>
                              <div className="col-span-3 truncate">
                                {doc.email}
                              </div>
                              <div className="col-span-3">
                                {doc.processed ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Processed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Pending
                                  </span>
                                )}
                              </div>
                              <div className="col-span-2 flex justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSendEmail(doc.email, doc.filename)}
                                  disabled={isSendingEmail}
                                  className="h-8 w-8 p-0"
                                  title="Send verification email"
                                >
                                  {isSendingEmail ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Mail className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {selectedDocuments.length} of {documents.length} documents
                      selected
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Process Tab */}
          <TabsContent value="process">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Structured Data Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database size={20} />
                    Extract Structured Data
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <p className="text-muted-foreground">
                      Extract and analyze structured data from your selected
                      documents
                    </p>

                    <Button
                      onClick={handleProcessStructured}
                      disabled={
                        isProcessingStructured || selectedDocuments.length === 0
                      }
                      className="w-full"
                    >
                      {isProcessingStructured ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Extract Data"
                      )}
                    </Button>

                    {structuredResults.length > 0 && (
                      <div className="mt-4 p-4 rounded-md bg-muted/50 max-h-64 overflow-y-auto">
                        <h3 className="font-medium mb-2">Processing Results</h3>
                        {structuredResults.map((result, idx) => (
                          <div key={idx} className="mb-2 text-sm">
                            <p className="font-medium">
                              {result.filename || result.path}
                            </p>
                            {result.error ? (
                              <p className="text-red-500">{result.error}</p>
                            ) : (
                              <p className="text-green-500">
                                Successfully processed
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Redaction Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download size={20} />
                    Redact Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label>Redaction Method</Label>
                      <RedactionMethodSelect
                        selected={method}
                        onSelect={setMethod}
                      />
                    </div>

                    {method === "replace" && (
                      <div className="space-y-2">
                        <Label htmlFor="replaceText">Replacement Text</Label>
                        <Input
                          id="replaceText"
                          type="text"
                          value={replaceText}
                          onChange={(e) => setReplaceText(e.target.value)}
                          placeholder="Enter text to replace sensitive information"
                        />
                      </div>
                    )}

                    <Button
                      onClick={handleRedactDocuments}
                      disabled={isRedacting || selectedDocuments.length === 0}
                      className="w-full"
                    >
                      {isRedacting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Redacting...
                        </>
                      ) : (
                        "Redact Documents"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 bg-accent border border-accent rounded-xl p-6">
          <h3 className="text-lg font-semibold text-accent-foreground mb-4">
            How It Works
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground font-medium">
                1
              </div>
              <div>
                <p className="text-accent-foreground font-medium">
                  Upload Documents
                </p>
                <p className="text-sm text-accent-foreground/80">
                  Add PDF files to the system
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground font-medium">
                2
              </div>
              <div>
                <p className="text-accent-foreground font-medium">
                  Process Documents
                </p>
                <p className="text-sm text-accent-foreground/80">
                  Extract structured data or redact sensitive info
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground font-medium">
                3
              </div>
              <div>
                <p className="text-accent-foreground font-medium">
                  Download & Share
                </p>
                <p className="text-sm text-accent-foreground/80">
                  Get your processed documents
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Index;
