'use client';

import { useRef, useState, useEffect } from 'react';

type ProfiTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function ProfiTextEditor({ value, onChange, placeholder = 'Type something...' }: ProfiTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value ?? '');
    editorRef.current?.focus();
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  return (
    <div className="border rounded-md shadow bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b p-2 text-sm bg-gray-50">
        {/* Formatting */}
        <button onClick={() => exec('bold')} className="toolbar-btn font-bold">B</button>
        <button onClick={() => exec('italic')} className="toolbar-btn italic">I</button>
        <button onClick={() => exec('underline')} className="toolbar-btn underline">U</button>
        <button onClick={() => exec('strikeThrough')} className="toolbar-btn line-through">S</button>

        {/* Headings */}
        <button onClick={() => exec('formatBlock', '<h1>')} className="toolbar-btn">H1</button>
        <button onClick={() => exec('formatBlock', '<h2>')} className="toolbar-btn">H2</button>
        <button onClick={() => exec('formatBlock', '<blockquote>')} className="toolbar-btn">❝</button>

        {/* Lists */}
        <button onClick={() => exec('insertUnorderedList')} className="toolbar-btn">• List</button>
        <button onClick={() => exec('insertOrderedList')} className="toolbar-btn">1. List</button>

        {/* Links */}
        <button onClick={() => {
          const url = prompt('Enter URL');
          if (url) exec('createLink', url);
        }} className="toolbar-btn">🔗</button>

        {/* Undo/Redo */}
        <button onClick={() => exec('undo')} className="toolbar-btn">↺</button>
        <button onClick={() => exec('redo')} className="toolbar-btn">↻</button>

        {/* Text Direction */}
        <button onClick={() => setDirection('ltr')} className={`toolbar-btn ${direction === 'ltr' && 'bg-blue-100'}`}>LTR</button>
        <button onClick={() => setDirection('rtl')} className={`toolbar-btn ${direction === 'rtl' && 'bg-blue-100'}`}>RTL</button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        dir={direction}
        className="min-h-[180px] p-4 outline-none prose max-w-none"
        data-placeholder={placeholder}
      />
    </div>
  );
}
