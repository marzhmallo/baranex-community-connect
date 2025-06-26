
import DocumentTemplateForm from "@/components/documents/DocumentTemplateForm";
import { useNavigate } from "react-router-dom";

const CreateDocumentTemplatePage = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate("/documents");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DocumentTemplateForm template={null} onClose={handleClose} />
    </div>
  );
};

export default CreateDocumentTemplatePage;
