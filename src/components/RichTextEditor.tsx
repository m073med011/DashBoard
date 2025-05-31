import { Editor } from "@tinymce/tinymce-react";
import React from "react";

type RichTextEditorProps = {
  value: string;
  onChange?: (content: string) => void;
  label?: string;
  readOnly?: boolean;
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  label, 
  readOnly = false 
}) => {
  return (
    <div className="my-6">
      {label && <label className="block mb-2 font-medium">{label}</label>}
      <Editor
        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
        value={value}
        onEditorChange={onChange}
        init={{
          height: 300,
          menubar: false,
          disabled: readOnly, // This makes the editor read-only
          plugins: [
            "link", "lists", "code", "autolink", "table", "image", "media"
          ],
          toolbar: readOnly 
            ? false // Hide toolbar when read-only
            : "undo redo | styleselect | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image media | code",
          content_style:
            "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
          automatic_uploads: true,
          images_upload_url: false,
          images_upload_handler: undefined,
          file_picker_types: "image",
          file_picker_callback: readOnly 
            ? undefined // Disable file picker when read-only
            : function (cb: (url: string, meta: { title: string }) => void) {
                const input = document.createElement("input");
                input.setAttribute("type", "file");
                input.setAttribute("accept", "image/*");
                input.onchange = function () {
                  const file = input.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = function () {
                    const base64 = reader.result as string;
                    cb(base64, { title: file.name });
                  };
                  reader.readAsDataURL(file);
                };
                input.click();
              },
        }}
      />
    </div>
  );
};

export default RichTextEditor;