
import { useState, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import DocumentTemplateForm from "@/components/documents/DocumentTemplateForm";

const CreateDocumentTemplatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const template = location.state?.template || null;
  const quillRef = useRef<ReactQuill>(null);
  const [editorContent, setEditorContent] = useState(template?.template || "");

  const handleClose = () => {
    navigate("/documents");
  };

  // Custom handler for inserting data fields
  const insertDataField = (fieldType: string, displayText: string) => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection();
      if (range) {
        // Insert the data field as a styled span
        const fieldHtml = `<span class="data-field" data-placeholder="${fieldType}" contenteditable="false">${displayText}</span>&nbsp;`;
        quill.clipboard.dangerouslyPasteHTML(range.index, fieldHtml);
        quill.setSelection({ index: range.index + 1, length: 0 });
      }
    }
  };

  // Custom toolbar with data field dropdown
  const CustomToolbar = () => (
    <div id="toolbar">
      <select className="ql-header" defaultValue="">
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="">Normal</option>
      </select>
      <button className="ql-bold" />
      <button className="ql-italic" />
      <button className="ql-underline" />
      <button className="ql-list" value="ordered" />
      <button className="ql-list" value="bullet" />
      <button className="ql-align" value="" />
      <button className="ql-align" value="center" />
      <button className="ql-align" value="right" />
      <select 
        className="ql-color" 
        onChange={(e) => {
          const value = e.target.value;
          if (value) {
            const [fieldType, displayText] = value.split('|');
            insertDataField(fieldType, displayText);
            e.target.value = '';
          }
        }}
        style={{ 
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        <option value="">Insert Data Field</option>
        <option value="resident_name|Resident's Full Name">Resident's Full Name</option>
        <option value="resident_address|Resident's Address">Resident's Address</option>
        <option value="resident_age|Resident's Age">Resident's Age</option>
        <option value="date_issued|Date Issued">Date Issued</option>
        <option value="reason_request|Reason for Request">Reason for Request</option>
      </select>
    </div>
  );

  const modules = useMemo(() => ({
    toolbar: {
      container: "#toolbar",
    },
  }), []);

  const formats = [
    'header', 'bold', 'italic', 'underline',
    'list', 'bullet', 'align', 'color', 'background'
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DocumentTemplateForm 
        template={template} 
        onClose={handleClose}
        customEditor={
          <div className="space-y-4">
            <CustomToolbar />
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={editorContent}
              onChange={setEditorContent}
              modules={modules}
              formats={formats}
              placeholder="Enter your document template content here..."
              style={{ 
                height: '300px',
                marginBottom: '50px'
              }}
            />
          </div>
        }
        editorContent={editorContent}
      />
    </div>
  );
};

export default CreateDocumentTemplatePage;
