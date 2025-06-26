
import { useEffect, useRef, useState } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Plus } from 'lucide-react';

// Custom Blot for data fields
const BlockEmbed = Quill.import('blots/block/embed');

class DataFieldBlot extends BlockEmbed {
  static blotName = 'dataField';
  static tagName = 'span';
  static className = 'data-field-pill';

  static create(value: { placeholder: string; label: string }) {
    const node = super.create();
    node.setAttribute('data-placeholder', value.placeholder);
    node.setAttribute('contenteditable', 'false');
    node.textContent = value.label;
    node.style.cssText = `
      background-color: #e0e7ff;
      color: #3730a3;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
      display: inline-block;
      margin: 0 2px;
      cursor: default;
      user-select: none;
    `;
    return node;
  }

  static value(node: HTMLElement) {
    return {
      placeholder: node.getAttribute('data-placeholder'),
      label: node.textContent,
    };
  }
}

Quill.register(DataFieldBlot);

interface TemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const TemplateEditor = ({ value, onChange, placeholder }: TemplateEditorProps) => {
  const quillRef = useRef<ReactQuill>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const dataFields = [
    { placeholder: 'resident_name', label: "Resident's Full Name" },
    { placeholder: 'resident_address', label: "Resident's Address" },
    { placeholder: 'resident_age', label: "Resident's Age" },
    { placeholder: 'date_issued', label: 'Date Issued' },
    { placeholder: 'purpose', label: 'Reason for Request' },
  ];

  const insertDataField = (field: { placeholder: string; label: string }) => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
      const range = quill.getSelection();
      if (range) {
        quill.insertEmbed(range.index, 'dataField', field);
        quill.setSelection({ index: range.index + 1, length: 0 });
      }
    }
    setShowDropdown(false);
  };

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'align': [] }],
        ['link'],
        ['clean'],
        ['data-field-button']
      ],
      handlers: {
        'data-field-button': () => {
          setShowDropdown(!showDropdown);
        }
      }
    }
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'align', 'link', 'dataField'
  ];

  useEffect(() => {
    const toolbar = document.querySelector('.ql-toolbar');
    if (toolbar) {
      // Remove existing custom button if it exists
      const existingButton = toolbar.querySelector('.ql-data-field-button');
      if (existingButton) {
        existingButton.remove();
      }

      // Create custom button
      const customButton = document.createElement('button');
      customButton.className = 'ql-data-field-button';
      customButton.innerHTML = '<span style="display: flex; align-items: center; gap: 4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>Field</span>';
      customButton.title = 'Insert Data Field';
      
      // Add custom styling
      customButton.style.cssText = `
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border: 1px solid #ccc;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        margin-left: 8px;
      `;

      toolbar.appendChild(customButton);
    }
  }, []);

  return (
    <div className="relative">
      <div className="border border-input rounded-lg">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          style={{ minHeight: '200px' }}
        />
      </div>
      
      {showDropdown && (
        <div className="absolute top-12 right-4 z-50">
          <div className="bg-white border border-input rounded-lg shadow-lg p-2 min-w-[200px]">
            <div className="text-sm font-medium text-muted-foreground mb-2 px-2">
              Insert Data Field
            </div>
            {dataFields.map((field) => (
              <button
                key={field.placeholder}
                onClick={() => insertDataField(field)}
                className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded transition-colors flex items-center gap-2"
              >
                <Plus className="h-3 w-3" />
                {field.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateEditor;
