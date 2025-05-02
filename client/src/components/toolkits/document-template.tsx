import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Document } from "@shared/schema";
import { Download, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DocumentTemplateProps {
  document: Document;
}

export default function DocumentTemplate({ document }: DocumentTemplateProps) {
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      // Log document download
      await apiRequest("GET", `/api/documents/${document.id}`);
      
      // Create a download link for the template content
      const blob = new Blob([document.templateContent], { type: "text/plain;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${document.templateName}.txt`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Document Downloaded",
        description: `${document.templateName} has been downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "There was an error downloading the document.",
        variant: "destructive",
      });
    }
  };

  const handlePreview = () => {
    // Show document content in a new window
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${document.templateName} - Preview</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
            h1 { color: #0B3D91; }
            pre { background-color: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>${document.templateName}</h1>
          <p>Document Type: ${document.docType}</p>
          <p>Version: ${document.version}</p>
          <pre>${document.templateContent}</pre>
        </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  // Determine icon and color based on document type
  const getDocTypeStyles = () => {
    switch (document.docType) {
      case 'NCNDA':
        return { icon: "ri-file-lock-line", color: "text-blue-600 bg-blue-50" };
      case 'IMFPA':
        return { icon: "ri-file-paper-line", color: "text-green-600 bg-green-50" };
      case 'SPA':
        return { icon: "ri-file-text-line", color: "text-purple-600 bg-purple-50" };
      case 'LOI':
        return { icon: "ri-file-list-3-line", color: "text-orange-600 bg-orange-50" };
      case 'ICPO':
        return { icon: "ri-file-copy-line", color: "text-red-600 bg-red-50" };
      case 'KYC_Form':
        return { icon: "ri-profile-line", color: "text-teal-600 bg-teal-50" };
      default:
        return { icon: "ri-file-line", color: "text-neutral-600 bg-neutral-50" };
    }
  };
  
  const { icon, color } = getDocTypeStyles();

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{document.templateName}</CardTitle>
            <CardDescription>
              {document.docType} · Version {document.version}
            </CardDescription>
          </div>
          <div className={`p-2 rounded ${color}`}>
            <i className={`${icon} text-xl`}></i>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-grow flex flex-col">
        <p className="text-sm text-neutral-600 mb-4 flex-grow">
          {document.commodityTypeScope && document.commodityTypeScope.length > 0 ? (
            <>
              <span className="font-medium">Applicable for: </span>
              {document.commodityTypeScope.join(", ")}
            </>
          ) : (
            "Standard template document for all commodity types."
          )}
        </p>
        <div className="flex gap-2 mt-auto">
          <Button variant="outline" size="sm" className="flex-1" onClick={handlePreview}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button size="sm" className="flex-1" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
