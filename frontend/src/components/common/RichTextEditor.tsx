import { useEffect, useMemo, useRef } from "react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

type ClassicEditorInstance = Awaited<ReturnType<typeof ClassicEditor.create>>;

const READ_ONLY_LOCK_ID = "dashboard-rich-text-editor";
const DEFAULT_TOOLBAR_ITEMS = [
  "heading",
  "|",
  "bold",
  "italic",
  "link",
  "bulletedList",
  "numberedList",
  "blockQuote",
  "|",
  "undo",
  "redo",
];

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  compact?: boolean;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
  invalid = false,
  compact = false,
  className = "",
}: RichTextEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<ClassicEditorInstance | null>(null);
  const onChangeRef = useRef(onChange);
  const lastValueRef = useRef(value);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const editorConfig = useMemo(
    () => ({
      placeholder,
      toolbar: {
        items: DEFAULT_TOOLBAR_ITEMS,
      },
    }),
    [placeholder],
  );

  useEffect(() => {
    let cancelled = false;

    const initializeEditor = async () => {
      if (!hostRef.current || editorRef.current) {
        return;
      }

      try {
        const editor = await ClassicEditor.create(hostRef.current, editorConfig);

        if (cancelled) {
          await editor.destroy();
          return;
        }

        editorRef.current = editor;
        const initialValue = lastValueRef.current;

        if (editor.getData() !== initialValue) {
          editor.setData(initialValue);
        }

        if (disabledRef.current) {
          editor.enableReadOnlyMode(READ_ONLY_LOCK_ID);
        }

        editor.model.document.on("change:data", () => {
          const nextValue = editor.getData();
          lastValueRef.current = nextValue;
          onChangeRef.current(nextValue);
        });
      } catch (error) {
        console.error("Failed to initialize CKEditor 5.", error);
      }
    };

    void initializeEditor();

    return () => {
      cancelled = true;

      const editor = editorRef.current;
      editorRef.current = null;

      if (editor) {
        void editor.destroy();
      }
    };
  }, [editorConfig]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      lastValueRef.current = value;
      return;
    }

    if (value !== lastValueRef.current && editor.getData() !== value) {
      lastValueRef.current = value;
      editor.setData(value);
    }
  }, [value]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    if (disabled) {
      editor.enableReadOnlyMode(READ_ONLY_LOCK_ID);
    } else {
      editor.disableReadOnlyMode(READ_ONLY_LOCK_ID);
    }
  }, [disabled]);

  const wrapperClassName = [
    "rich-text-editor",
    compact ? "rich-text-editor-compact" : "",
    invalid ? "rich-text-editor-invalid" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClassName}>
      <div ref={hostRef} />
    </div>
  );
}
