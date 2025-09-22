import React from "react";
import { Editor } from "@tinymce/tinymce-react";

interface TinyMCEEditor {
  ui: {
    registry: {
      addButton: (name: string, config: { text: string; onAction: () => void }) => void;
    };
  };
  addShortcut: (shortcut: string, description: string, callback: () => void) => void;
}

interface FileMeta {
  filetype: string;
  title?: string;
}

type FilePickerCallback = (url: string, meta: { title: string }) => void;

type RichTextEditorProps = {
  value: string;
  onChange?: (content: string) => void;
  label?: string;
  readOnly?: boolean;
  height?: number;
  placeholder?: string;
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  label,
  readOnly = false,
  height = 400,
  placeholder = "Start typing..."
}) => {
  return (
    <div className="my-4">
      {label && (
        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <div>
        <Editor
          apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "your-api-key-here"}
          value={value}
          onEditorChange={onChange}
          init={{
            height: height,
            menubar: true,
            disabled: readOnly,
            placeholder: placeholder,
            
            // Extensive plugin list for advanced features
            plugins: [
              "advlist", "autolink", "lists", "link", "image", "charmap", "preview",
              "anchor", "searchreplace", "visualblocks", "code", "fullscreen",
              "insertdatetime", "media", "table", "help", "wordcount",
              "emoticons", "template", "paste", "print", "hr", "pagebreak",
              "nonbreaking", "directionality", "visualchars", "noneditable",
              "quickbars", "save", "codesample", "importcss", "toc"
            ],
            
            // Comprehensive toolbar with multiple rows
            toolbar: readOnly
              ? false
              : [
                  // First row - File operations and basic formatting
                  "undo redo | save print preview | cut copy paste pastetext | searchreplace | fullscreen code",
                  
                  // Second row - Text formatting
                  "styles fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor | removeformat",
                  
                  // Third row - Paragraph formatting and lists
                  "alignleft aligncenter alignright alignjustify | outdent indent | bullist numlist | ltr rtl",
                  
                  // Fourth row - Insert elements
                  "link unlink anchor | image media codesample | table | charmap emoticons hr pagebreak nonbreaking | template | insertdatetime | toc",
                  
                  // Fifth row - Additional tools
                  "visualblocks visualchars | subscript superscript | blockquote | help"
                ].join(" | "),
            
            // Enhanced toolbar options
            toolbar_mode: "sliding",
            toolbar_sticky: true,
            
            // Quick insert toolbar
            quickbars_selection_toolbar: "bold italic | quicklink h2 h3 blockquote",
            quickbars_insert_toolbar: "quickimage quicktable quicklink",
            
            // Context menu
            contextmenu: "link image table | cell row column deletetable | copy paste",
            
            // Menu bar configuration
            menu: {
              file: { title: "File", items: "newdocument restoredraft | preview | export print | deleteallconversations" },
              edit: { title: "Edit", items: "undo redo | cut copy paste pastetext | selectall | searchreplace" },
              view: { title: "View", items: "code | visualaid visualchars visualblocks | preview fullscreen | showcomments" },
              insert: { title: "Insert", items: "image link media addcomment pageembed template codesample inserttable | charmap emoticons hr | pagebreak nonbreaking anchor tableofcontents | insertdatetime" },
              format: { title: "Format", items: "bold italic underline strikethrough superscript subscript codeformat | styles blocks fontfamily fontsize align lineheight | forecolor backcolor | language | removeformat" },
              tools: { title: "Tools", items: "spellchecker spellcheckerlanguage | a11ycheck code wordcount" },
              table: { title: "Table", items: "inserttable | cell row column | advtablesort | tableprops deletetable" },
              help: { title: "Help", items: "help" }
            },
            
            // Style formats dropdown
            style_formats: [
              { title: "Headings", items: [
                { title: "Heading 1", format: "h1" },
                { title: "Heading 2", format: "h2" },
                { title: "Heading 3", format: "h3" },
                { title: "Heading 4", format: "h4" },
                { title: "Heading 5", format: "h5" },
                { title: "Heading 6", format: "h6" }
              ]},
              { title: "Inline", items: [
                { title: "Bold", format: "bold" },
                { title: "Italic", format: "italic" },
                { title: "Underline", format: "underline" },
                { title: "Strikethrough", format: "strikethrough" },
                { title: "Superscript", format: "superscript" },
                { title: "Subscript", format: "subscript" },
                { title: "Code", format: "code" }
              ]},
              { title: "Blocks", items: [
                { title: "Paragraph", format: "p" },
                { title: "Blockquote", format: "blockquote" },
                { title: "Div", format: "div" },
                { title: "Pre", format: "pre" }
              ]},
              { title: "Align", items: [
                { title: "Left", format: "alignleft" },
                { title: "Center", format: "aligncenter" },
                { title: "Right", format: "alignright" },
                { title: "Justify", format: "alignjustify" }
              ]}
            ],
            
            // Font options
            font_family_formats: 
              "Arial=arial,helvetica,sans-serif; " +
              "Arial Black=arial black,avant garde; " +
              "Georgia=georgia,palatino; " +
              "Helvetica=helvetica; " +
              "Impact=impact,chicago; " +
              "Tahoma=tahoma,arial,helvetica,sans-serif; " +
              "Terminal=terminal,monaco; " +
              "Times New Roman=times new roman,times; " +
              "Trebuchet MS=trebuchet ms,geneva; " +
              "Verdana=verdana,geneva; " +
              "Courier New=courier new,courier; " +
              "Comic Sans MS=comic sans ms,sans-serif",
            
            font_size_formats: "8pt 10pt 12pt 14pt 16pt 18pt 24pt 36pt 48pt",
            
            // Image and media configuration
            image_advtab: true,
            image_caption: true,
            image_dimensions: true,
            image_class_list: [
              { title: "None", value: "" },
              { title: "Rounded", value: "rounded-lg" },
              { title: "Circle", value: "rounded-full" },
              { title: "Shadow", value: "shadow-lg" }
            ],
            
            // Table configuration
            table_class_list: [
              { title: "None", value: "" },
              { title: "Striped", value: "table-striped" },
              { title: "Bordered", value: "table-bordered" },
              { title: "Hover", value: "table-hover" }
            ],
            table_default_attributes: {
              border: "1"
            },
            table_default_styles: {
              width: "100%"
            },
            
            // Advanced paste options
            paste_data_images: true,
            paste_as_text: false,
            paste_word_valid_elements: "b,strong,i,em,h1,h2,h3,h4,h5,h6,p,div,ul,ol,li,a,table,tr,td,th,thead,tbody,tfoot",
            
            // Content styling
            content_style: `
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                font-size: 14px;
                line-height: 1.6;
                color: #333;
                background-color: #fff;
                padding: 12px;
              }
              @media (prefers-color-scheme: dark) {
                body {
                  color: #e5e7eb;
                  background-color: #1f2937;
                }
                blockquote {
                  border-left-color: #4b5563 !important;
                  color: #9ca3af !important;
                }
                pre {
                  background-color: #374151 !important;
                  border-color: #4b5563 !important;
                  color: #e5e7eb !important;
                }
                code {
                  background-color: #374151 !important;
                  color: #e5e7eb !important;
                }
                table td, table th {
                  border-color: #4b5563 !important;
                }
                table th {
                  background-color: #374151 !important;
                  color: #e5e7eb !important;
                }
                a {
                  color: #60a5fa !important;
                }
              }
              p { margin: 10px 0; }
              h1 { font-size: 2em; font-weight: bold; margin: 20px 0 10px; }
              h2 { font-size: 1.5em; font-weight: bold; margin: 18px 0 8px; }
              h3 { font-size: 1.17em; font-weight: bold; margin: 16px 0 6px; }
              h4 { font-size: 1em; font-weight: bold; margin: 14px 0 4px; }
              h5 { font-size: 0.83em; font-weight: bold; margin: 12px 0 2px; }
              h6 { font-size: 0.67em; font-weight: bold; margin: 10px 0; }
              blockquote { 
                border-left: 4px solid #ddd; 
                padding-left: 16px; 
                color: #666; 
                margin: 16px 0;
                font-style: italic;
              }
              pre {
                background-color: #f4f4f4;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 12px;
                overflow-x: auto;
              }
              code {
                background-color: #f4f4f4;
                padding: 2px 4px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
              }
              table {
                border-collapse: collapse;
                width: 100%;
                margin: 16px 0;
              }
              table td, table th {
                border: 1px solid #ddd;
                padding: 8px;
              }
              table th {
                background-color: #f4f4f4;
                font-weight: bold;
              }
              a {
                color: #0066cc;
                text-decoration: none;
              }
              a:hover {
                text-decoration: underline;
              }
              .mce-content-body[dir="rtl"] {
                direction: rtl;
                text-align: right;
              }
            `,
            
            // Directionality support for RTL languages
            directionality: "ltr",
            
            // Browser spell checker
            browser_spellcheck: true,
            
            // Status bar
            statusbar: true,
            elementpath: true,
            
            // Resizing
            resize: true,
            
            // Autosave
            autosave_interval: "30s",
            autosave_retention: "30m",
            
            // Word count
            wordcount: {
              countWords: true,
              countCharacters: true
            },
            
            // File handling
            automatic_uploads: true,
            file_picker_types: "image media file",
            file_picker_callback: readOnly
              ? undefined
              : function (cb: FilePickerCallback, value: string, meta: FileMeta) {
                  // File picker implementation
                  if (meta.filetype === "file") {
                    // Handle file uploads
                    const input = document.createElement("input");
                    input.setAttribute("type", "file");
                    input.setAttribute("accept", ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx");
                    
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
                  }
                  
                  if (meta.filetype === "image") {
                    // Handle image uploads
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
                  }
                  
                  if (meta.filetype === "media") {
                    // Handle media uploads
                    const input = document.createElement("input");
                    input.setAttribute("type", "file");
                    input.setAttribute("accept", "video/*,audio/*");
                    
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
                  }
                },
                
            // Templates
            templates: [
              {
                title: "Business Letter",
                description: "A basic business letter template",
                content: '<p>Dear [Name],</p><p><br></p><p>I am writing to...</p><p><br></p><p>Sincerely,<br>[Your Name]</p>'
              },
              {
                title: "Meeting Notes",
                description: "Template for meeting notes",
                content: '<h2>Meeting Notes</h2><p><strong>Date:</strong> [Date]</p><p><strong>Attendees:</strong> [Names]</p><h3>Agenda Items</h3><ul><li>Item 1</li><li>Item 2</li></ul><h3>Action Items</h3><ul><li>[ ] Action 1</li><li>[ ] Action 2</li></ul>'
              }
            ],
            
            // Link settings
            link_default_target: "_blank",
            link_context_toolbar: true,
            
            // Valid elements (security)
            valid_elements: "*[*]",
            extended_valid_elements: "*[*]",
            
            // Setup function
            setup: function(editor: TinyMCEEditor) {
              // Add custom buttons if needed
              editor.ui.registry.addButton("customButton", {
                text: "Custom",
                onAction: function() {
                  alert("Custom button clicked!");
                }
              });
              
              // Add keyboard shortcuts
              editor.addShortcut("ctrl+shift+c", "Custom action", function() {
                console.log("Custom shortcut triggered");
              });
            }
          }}
        />
      </div>
      
      {/* Optional character/word count display */}
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-right">
        Press Alt+0 for help
      </div>
    </div>
  );
};

export default RichTextEditor;