
import { useNavigate } from "react-router-dom";
import DocumentTemplateForm from "@/components/documents/DocumentTemplateForm";

const DocumentTemplateAddPage = () => {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate("/documents");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DocumentTemplateForm onClose={handleClose} />
    </div>
  );
};

export default DocumentTemplateAddPage;
