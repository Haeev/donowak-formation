'use client';

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  Youtube as YoutubeIcon,
  Heading1,
  Heading2,
  Quote,
  Undo,
  Redo,
  Code,
  Pilcrow,
  SeparatorHorizontal,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/use-toast';

interface ContentEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

const ContentEditor = ({
  initialContent = '',
  onChange,
  placeholder = 'Commencez à rédiger votre contenu...',
  readOnly = false,
  className = '',
}: ContentEditorProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showYoutubeDialog, setShowYoutubeDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  // Initialiser l'éditeur
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Youtube,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline cursor-pointer',
        },
      }),
    ],
    content: initialContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  // Gérer l'upload d'image
  const handleImageUpload = async (file: File) => {
    if (!file || !editor) return;

    try {
      setUploadingImage(true);
      const supabase = createClient();

      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `lessons/${fileName}`;

      // Uploader l'image
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error('Erreur lors de l\'upload de l\'image');
      }

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // Insérer l'image dans l'éditeur
      editor.chain().focus().setImage({ src: publicUrl }).run();

      toast({
        title: 'Image ajoutée',
        description: 'L\'image a été ajoutée avec succès',
      });
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'image:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'upload de l\'image',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(false);
      setSelectedImage(null);
    }
  };

  // Gérer l'ajout d'une vidéo YouTube
  const handleYoutubeEmbed = () => {
    if (!editor || !youtubeUrl) return;

    editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
    setYoutubeUrl('');
    setShowYoutubeDialog(false);
    
    toast({
      title: 'Vidéo ajoutée',
      description: 'La vidéo YouTube a été intégrée avec succès',
    });
  };

  // Gérer l'ajout d'un lien
  const handleLinkAdd = () => {
    if (!editor || !linkUrl) return;

    // Vérifier si le lien a le bon format
    if (!/^https?:\/\//.test(linkUrl)) {
      setLinkUrl(`https://${linkUrl}`);
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: linkUrl })
      .run();

    setLinkUrl('');
    setShowLinkDialog(false);
  };

  // Gérer le téléchargement d'une image
  const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    handleImageUpload(file);
  };

  // S'il n'y a pas d'éditeur, ne rien afficher
  if (!editor) {
    return null;
  }

  return (
    <div className={`border rounded-md ${className}`}>
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/50">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-muted' : ''}
          disabled={readOnly}
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-muted' : ''}
          disabled={readOnly}
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-muted' : ''}
          disabled={readOnly}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
          disabled={readOnly}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-muted' : ''}
          disabled={readOnly}
        >
          <List className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive('orderedList') ? 'bg-muted' : ''}
          disabled={readOnly}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive('blockquote') ? 'bg-muted' : ''}
          disabled={readOnly}
        >
          <Quote className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={editor.isActive('codeBlock') ? 'bg-muted' : ''}
          disabled={readOnly}
        >
          <Code className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={editor.isActive('paragraph') ? 'bg-muted' : ''}
          disabled={readOnly}
        >
          <Pilcrow className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />
        
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => setShowLinkDialog(true)}
          className={editor.isActive('link') ? 'bg-muted' : ''}
          disabled={readOnly}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        
        <label>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            asChild
            disabled={readOnly || uploadingImage}
          >
            <div className="cursor-pointer">
              <ImageIcon className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelection}
                className="hidden"
                disabled={readOnly || uploadingImage}
              />
            </div>
          </Button>
        </label>
        
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => setShowYoutubeDialog(true)}
          disabled={readOnly}
        >
          <YoutubeIcon className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          disabled={readOnly}
        >
          <SeparatorHorizontal className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />
        
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run() || readOnly}
        >
          <Undo className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run() || readOnly}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Dialogue pour ajouter un lien */}
      {showLinkDialog && (
        <div className="p-2 border-b">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="Entrez l'URL du lien"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button onClick={handleLinkAdd} disabled={!linkUrl}>
              Ajouter
            </Button>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Dialogue pour ajouter une vidéo YouTube */}
      {showYoutubeDialog && (
        <div className="p-2 border-b">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="Entrez l'URL de la vidéo YouTube"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button onClick={handleYoutubeEmbed} disabled={!youtubeUrl}>
              Intégrer
            </Button>
            <Button variant="outline" onClick={() => setShowYoutubeDialog(false)}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Menu bulle qui apparaît lors de la sélection de texte */}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border rounded-md shadow-md p-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'bg-muted' : ''}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'bg-muted' : ''}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setShowLinkDialog(true)}
              className={editor.isActive('link') ? 'bg-muted' : ''}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </div>
        </BubbleMenu>
      )}

      {/* Contenu de l'éditeur */}
      <EditorContent editor={editor} className="prose dark:prose-invert max-w-none p-4" />
    </div>
  );
};

export default ContentEditor; 