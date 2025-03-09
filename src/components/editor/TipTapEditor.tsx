'use client';

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight } from 'lowlight/lib/core';
import { FC, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Link as LinkIcon, 
  ImageIcon, 
  Code,
  Quote,
  HelpCircle
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Node } from '@tiptap/core';
import QuizBlock from './QuizBlock';
import { Quiz } from './QuizCreator';

// Define a Quiz Node extension for TipTap
const QuizNode = Node.create({
  name: 'quiz',
  group: 'block',
  atom: true, // Prevent the node from being split
  draggable: true,

  addAttributes() {
    return {
      quiz: {
        default: null,
        parseHTML: element => {
          const quizData = element.getAttribute('data-quiz');
          if (quizData) {
            try {
              return JSON.parse(quizData);
            } catch (e) {
              return null;
            }
          }
          return null;
        },
        renderHTML: attributes => {
          if (!attributes.quiz) return {};
          return {
            'data-quiz': JSON.stringify(attributes.quiz),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="quiz"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'quiz', ...HTMLAttributes }, 0];
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement('div');
      dom.classList.add('quiz-node');

      const quizData = node.attrs.quiz;
      
      // React component wrapper
      const ReactComponent = () => {
        const handleSave = (updatedQuiz: Quiz) => {
          if (typeof getPos === 'function') {
            editor.commands.command(({ tr }) => {
              tr.setNodeAttribute(getPos(), 'quiz', updatedQuiz);
              return true;
            });
          }
        };

        const handleDelete = () => {
          if (typeof getPos === 'function') {
            editor.commands.deleteRange({ from: getPos(), to: getPos() + node.nodeSize });
          }
        };

        return (
          <div className="my-4">
            <QuizBlock 
              initialQuiz={quizData} 
              onSave={handleSave} 
              onDelete={handleDelete}
              readOnly={!editor.isEditable}
            />
          </div>
        );
      };

      // Mount the React component
      dom.setAttribute('data-type', 'quiz');
      if (quizData) {
        dom.setAttribute('data-quiz', JSON.stringify(quizData));
      }

      return {
        dom,
        ReactComponent,
        update(node) {
          if (node.attrs.quiz) {
            dom.setAttribute('data-quiz', JSON.stringify(node.attrs.quiz));
          }
          return true;
        },
      };
    };
  },
});

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const TipTapEditor: FC<TipTapEditorProps> = ({ 
  content, 
  onChange, 
  placeholder = 'Commencez à écrire votre contenu...',
  readOnly = false 
}) => {
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [showLinkPopover, setShowLinkPopover] = useState<boolean>(false);
  const linkPopoverRef = useRef<HTMLDivElement>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [showImagePopover, setShowImagePopover] = useState<boolean>(false);
  const imagePopoverRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        linkOnPaste: true,
      }),
      Image.configure({
        allowBase64: true,
        inline: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      QuizNode,
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // Update link
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: linkUrl })
      .run();

    setShowLinkPopover(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (!editor) return;
    
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImagePopover(false);
    }
  }, [editor, imageUrl]);

  const addQuiz = useCallback(() => {
    if (!editor) return;
    
    editor.chain().focus().insertContent({
      type: 'quiz',
      attrs: { quiz: null },
    }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-md">
      {!readOnly && (
        <div className="flex flex-wrap gap-1 p-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-accent' : ''}
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-accent' : ''}
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-accent' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-accent' : ''}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'bg-accent' : ''}
          >
            <Quote className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive('codeBlock') ? 'bg-accent' : ''}
          >
            <Code className="h-4 w-4" />
          </Button>
          
          <Popover 
            open={showLinkPopover}
            onOpenChange={setShowLinkPopover}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (editor.isActive('link')) {
                    setLinkUrl(editor.getAttributes('link').href);
                  }
                  setShowLinkPopover(true);
                }}
                className={editor.isActive('link') ? 'bg-accent' : ''}
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent ref={linkPopoverRef} className="w-80">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="link-url">URL</Label>
                <div className="flex space-x-2">
                  <Input
                    id="link-url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                  <Button onClick={setLink}>Appliquer</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Popover 
            open={showImagePopover}
            onOpenChange={setShowImagePopover}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImagePopover(true)}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent ref={imagePopoverRef} className="w-80">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="image-url">URL de l'image</Label>
                <div className="flex space-x-2">
                  <Input
                    id="image-url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  <Button onClick={addImage}>Insérer</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={addQuiz}
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <EditorContent editor={editor} className="prose max-w-none p-4" />
      
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex rounded-lg shadow-lg bg-white border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'bg-accent' : ''}
            >
              <Bold className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'bg-accent' : ''}
            >
              <Italic className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (editor.isActive('link')) {
                  setLinkUrl(editor.getAttributes('link').href);
                }
                setShowLinkPopover(true);
              }}
              className={editor.isActive('link') ? 'bg-accent' : ''}
            >
              <LinkIcon className="h-3 w-3" />
            </Button>
          </div>
        </BubbleMenu>
      )}
    </div>
  );
};

export default TipTapEditor; 