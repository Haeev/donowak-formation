'use client';

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
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
  Table as TableIcon,
  Music,
  FileQuestion,
  Puzzle,
  FileCode,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Exercise } from './ExerciseCreator';

interface ContentEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  onAddExercise?: () => void;
  onAddQuiz?: () => void;
}

// Initialiser lowlight avec les langages communs
const lowlight = createLowlight(common);

const ContentEditor = ({
  initialContent = '',
  onChange,
  placeholder = 'Commencez à rédiger votre contenu...',
  readOnly = false,
  className = '',
  onAddExercise,
  onAddQuiz,
}: ContentEditorProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showYoutubeDialog, setShowYoutubeDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [codeContent, setCodeContent] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [showHtmlDialog, setShowHtmlDialog] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');

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
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({
        lowlight,
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

  // Gérer l'upload d'audio
  const handleAudioUpload = async (file: File) => {
    if (!file || !editor) return;

    try {
      setUploadingAudio(true);
      const supabase = createClient();

      // Générer un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `lessons/${fileName}`;

      // Uploader le fichier audio
      const { error: uploadError } = await supabase.storage
        .from('audio')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error('Erreur lors de l\'upload du fichier audio');
      }

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('audio')
        .getPublicUrl(filePath);

      // Insérer l'audio dans l'éditeur
      const audioHtml = `
        <div class="audio-player my-4">
          <audio controls>
            <source src="${publicUrl}" type="audio/${fileExt}">
            Votre navigateur ne supporte pas l'élément audio.
          </audio>
          <div class="text-sm text-gray-500 mt-1">${file.name}</div>
        </div>
      `;
      
      editor.chain().focus().insertContent(audioHtml).run();

      toast({
        title: 'Audio ajouté',
        description: 'Le fichier audio a été ajouté avec succès',
      });
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier audio:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'upload du fichier audio',
        variant: 'destructive',
      });
    } finally {
      setUploadingAudio(false);
      setAudioFile(null);
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

  // Gérer l'ajout d'un tableau
  const handleTableAdd = () => {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .insertTable({ rows: tableRows, cols: tableCols, withHeaderRow: true })
      .run();

    setShowTableDialog(false);
  };

  // Gérer l'ajout d'un bloc de code
  const handleCodeBlockAdd = () => {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .setCodeBlock({ language: codeLanguage })
      .insertContent(codeContent)
      .run();

    setShowCodeDialog(false);
    setCodeContent('');
  };

  // Gérer l'ajout de HTML personnalisé
  const handleHtmlAdd = () => {
    if (!editor || !htmlContent) return;

    editor.chain().focus().insertContent(htmlContent).run();
    setHtmlContent('');
    setShowHtmlDialog(false);
    
    toast({
      title: 'HTML ajouté',
      description: 'Le code HTML a été inséré avec succès',
    });
  };

  // Gérer le téléchargement d'une image
  const handleImageSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    handleImageUpload(file);
  };

  // Gérer le téléchargement d'un fichier audio
  const handleAudioSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);
    handleAudioUpload(file);
  };

  // Gérer l'ajout d'un exercice interactif
  const handleAddExercise = () => {
    if (onAddExercise) {
      onAddExercise();
    }
  };

  // Gérer l'ajout d'un quiz
  const handleAddQuiz = () => {
    if (onAddQuiz) {
      onAddQuiz();
    }
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
          onClick={() => setShowCodeDialog(true)}
          className={editor.isActive('codeBlock') ? 'bg-muted' : ''}
          disabled={readOnly}
        >
          <Code className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => setShowHtmlDialog(true)}
          disabled={readOnly}
          title="Insérer du HTML"
        >
          <FileCode className="h-4 w-4" />
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

        <label>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            asChild
            disabled={readOnly || uploadingAudio}
          >
            <div className="cursor-pointer">
              <Music className="h-4 w-4" />
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioSelection}
                className="hidden"
                disabled={readOnly || uploadingAudio}
              />
            </div>
          </Button>
        </label>
        
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => setShowTableDialog(true)}
          disabled={readOnly}
        >
          <TableIcon className="h-4 w-4" />
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
          onClick={handleAddQuiz}
          disabled={readOnly || !onAddQuiz}
          title="Ajouter un quiz"
        >
          <FileQuestion className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleAddExercise}
          disabled={readOnly || !onAddExercise}
          title="Ajouter un exercice interactif"
        >
          <Puzzle className="h-4 w-4" />
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
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un lien</DialogTitle>
            <DialogDescription>
              Entrez l'URL du lien que vous souhaitez ajouter
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <label htmlFor="link" className="sr-only">Lien</label>
              <input
                id="link"
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://exemple.com"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button variant="secondary" onClick={() => setShowLinkDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleLinkAdd} disabled={!linkUrl}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue pour ajouter une vidéo YouTube */}
      <Dialog open={showYoutubeDialog} onOpenChange={setShowYoutubeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une vidéo YouTube</DialogTitle>
            <DialogDescription>
              Entrez l'URL de la vidéo YouTube que vous souhaitez intégrer
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <div className="grid flex-1 gap-2">
              <label htmlFor="youtube" className="sr-only">Vidéo YouTube</label>
              <input
                id="youtube"
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button variant="secondary" onClick={() => setShowYoutubeDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleYoutubeEmbed} disabled={!youtubeUrl}>
              Intégrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue pour ajouter un tableau */}
      <Dialog open={showTableDialog} onOpenChange={setShowTableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un tableau</DialogTitle>
            <DialogDescription>
              Définissez les dimensions du tableau
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="rows" className="block text-sm font-medium mb-1">
                  Lignes
                </label>
                <input
                  id="rows"
                  type="number"
                  min="1"
                  max="10"
                  value={tableRows}
                  onChange={(e) => setTableRows(parseInt(e.target.value) || 2)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="cols" className="block text-sm font-medium mb-1">
                  Colonnes
                </label>
                <input
                  id="cols"
                  type="number"
                  min="1"
                  max="10"
                  value={tableCols}
                  onChange={(e) => setTableCols(parseInt(e.target.value) || 2)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button variant="secondary" onClick={() => setShowTableDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleTableAdd}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue pour ajouter un bloc de code */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un bloc de code</DialogTitle>
            <DialogDescription>
              Entrez votre code et sélectionnez le langage
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label htmlFor="language" className="block text-sm font-medium mb-1">
                Langage
              </label>
              <select
                id="language"
                value={codeLanguage}
                onChange={(e) => setCodeLanguage(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="python">Python</option>
                <option value="php">PHP</option>
                <option value="java">Java</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="csharp">C#</option>
                <option value="ruby">Ruby</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="swift">Swift</option>
                <option value="kotlin">Kotlin</option>
                <option value="sql">SQL</option>
                <option value="bash">Bash</option>
                <option value="json">JSON</option>
                <option value="yaml">YAML</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-1">
                Code
              </label>
              <textarea
                id="code"
                value={codeContent}
                onChange={(e) => setCodeContent(e.target.value)}
                rows={8}
                placeholder="Entrez votre code ici..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button variant="secondary" onClick={() => setShowCodeDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCodeBlockAdd}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogue pour ajouter du HTML personnalisé */}
      <Dialog open={showHtmlDialog} onOpenChange={setShowHtmlDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insérer du HTML personnalisé</DialogTitle>
            <DialogDescription>
              Entrez le code HTML que vous souhaitez insérer
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label htmlFor="html" className="block text-sm font-medium mb-1">
                Code HTML
              </label>
              <textarea
                id="html"
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                rows={8}
                placeholder="<div>Votre HTML ici...</div>"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button variant="secondary" onClick={() => setShowHtmlDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleHtmlAdd} disabled={!htmlContent}>
              Insérer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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