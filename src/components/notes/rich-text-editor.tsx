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

import { Button } from "@/components/ui/button";
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
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "note-editor min-h-[320px] px-4 py-4 text-sm leading-relaxed focus:outline-none sm:px-5 sm:py-5",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  if (!editor) {
    return (
      <div className="min-h-[360px] rounded-3xl border border-border/60 bg-muted/20 p-5 text-sm text-muted-foreground">
        Loading editor…
      </div>
    );
  }

  const isEmpty = editor.isEmpty;

  return (
    <div className="overflow-hidden rounded-3xl border border-border/60 bg-muted/15">
      <div className="flex flex-wrap gap-1 border-b border-border/60 bg-muted/25 p-2">
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
          <p className="pointer-events-none absolute left-4 top-4 text-sm text-muted-foreground sm:left-5 sm:top-5">
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
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className={cn(
        "size-8 rounded-xl",
        active && "bg-background/70 text-foreground",
      )}
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </Button>
  );
}
