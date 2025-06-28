
import { useState, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import DocumentTemplateForm from "@/components/documents/DocumentTemplateForm";

const CreateDocumentTemplatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const template = location.state?.template || null;

  const handleClose = () => {
    navigate("/documents");
  };

  const handleSuccess = () => {
    navigate("/documents");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto py-8">
        <DocumentTemplateForm 
          template={template} 
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
};

export default CreateDocumentTemplatePage;
