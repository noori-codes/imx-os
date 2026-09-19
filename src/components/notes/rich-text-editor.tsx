"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";

import { cn } from "@/lib/utils";

type RichTextEditorProps = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing…",
}: RichTextEditorProps) {
  const editorId = "note-body-editor";
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
      }),
    ],
    content: content || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        id: editorId,
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": placeholder,
        class:
          "note-editor min-h-[min(70vh,36rem)] px-2 py-5 text-[16px] leading-8 focus:outline-none sm:px-4 sm:py-6 sm:text-[17px] sm:leading-8",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  if (!editor) {
    return (
      <div
        className="min-h-[min(70vh,36rem)] px-4 py-6 text-sm text-muted-foreground"
        role="status"
        aria-label="Loading editor"
      >
        Loading editor…
      </div>
    );
  }

  const isEmpty = editor.isEmpty;

  return (
    <div className="notes-rte mt-5">
      <div
        className="notes-rte-toolbar sticky top-0 z-2 -mx-1 mb-1 flex flex-wrap gap-0.5 rounded-xl border border-border/25 bg-background/70 px-1.5 py-1.5 backdrop-blur-md supports-[backdrop-filter]:bg-background/55"
        role="toolbar"
        aria-label="Formatting"
        aria-controls={editorId}
      >
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="Bold"
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="Italic"
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          label="Heading"
        >
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="Bullet list"
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="Ordered list"
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          label="Quote"
        >
          <Quote className="size-4" />
        </ToolbarButton>
      </div>

      <div className="relative">
        {isEmpty ? (
          <p
            id={`${editorId}-placeholder`}
            className="pointer-events-none absolute top-5 left-2 text-[16px] leading-8 text-muted-foreground/70 sm:top-6 sm:left-4 sm:text-[17px]"
            aria-hidden
          >
            {placeholder}
          </p>
        ) : null}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  active,
  onClick,
  label,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground",
        active && "bg-muted text-foreground",
      )}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}
