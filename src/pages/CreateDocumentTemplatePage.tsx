
import DocumentTemplateForm from "@/components/documents/DocumentTemplateForm";
import { useNavigate, useLocation } from "react-router-dom";

const CreateDocumentTemplatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const template = location.state?.template || null;

  const handleClose = () => {
    navigate("/documents");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DocumentTemplateForm template={template} onClose={handleClose} />
    </div>
  );
};

export default CreateDocumentTemplatePage;
