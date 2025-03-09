'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft, ImagePlus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

// Schéma de validation du formulaire
const formSchema = z.object({
  title: z.string().min(3, {
    message: 'Le titre doit contenir au moins 3 caractères',
  }).max(100, {
    message: 'Le titre ne doit pas dépasser 100 caractères',
  }),
  description: z.string().min(10, {
    message: 'La description doit contenir au moins 10 caractères',
  }).max(2000, {
    message: 'La description ne doit pas dépasser 2000 caractères',
  }),
  price: z.coerce.number().min(0, {
    message: 'Le prix doit être supérieur ou égal à 0',
  }).max(9999, {
    message: 'Le prix ne doit pas dépasser 9999€',
  }),
  published: z.boolean().default(false),
  image_url: z.string().optional(),
});

// Type inféré à partir du schéma
type FormValues = z.infer<typeof formSchema>;

/**
 * Page de création d'une formation
 * Permet à l'administrateur de créer une nouvelle formation
 */
export default function AdminCreateFormationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const router = useRouter();
  
  // Initialiser le formulaire avec des valeurs par défaut
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      published: false,
      image_url: '',
    },
  });
  
  // Gérer les changements dans le champ de l'image
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      setSelectedImage(file);
      
      // Créer une URL pour la prévisualisation
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Vous pouvez choisir de stocker l'URL dans le formulaire ou non
      // form.setValue('image_url', url);
    }
  };
  
  // Soumettre le formulaire
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      const supabase = createClient();
      
      // Vérifier si l'utilisateur est authentifié et a le rôle admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Vous devez être connecté pour créer une formation');
      }
      
      // Vérifier le rôle de l'utilisateur
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        console.error('Erreur lors de la vérification du profil:', profileError);
        throw new Error('Impossible de vérifier vos permissions');
      }
      
      if (profileData?.role !== 'admin') {
        throw new Error('Vous devez être administrateur pour créer une formation');
      }
      
      // Gérer l'upload de l'image si elle existe
      if (selectedImage) {
        try {
          const fileExt = selectedImage.name.split('.').pop();
          const fileName = `${uuidv4()}.${fileExt}`;
          const filePath = `formations/${fileName}`;
          
          // Vérifier si le bucket existe
          const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
          
          if (bucketsError) {
            console.error('Erreur lors de la vérification des buckets:', bucketsError);
            toast({
              title: 'Avertissement',
              description: 'Impossible de vérifier les buckets de stockage. La formation sera créée sans image.',
              variant: 'destructive',
            });
          } else {
            const imagesBucketExists = buckets.some(bucket => bucket.name === 'images');
            
            if (!imagesBucketExists) {
              console.error('Le bucket "images" n\'existe pas dans Supabase Storage');
              
              // Tentative de création du bucket
              try {
                const { error: createBucketError } = await supabase.storage.createBucket('images', {
                  public: true,
                  fileSizeLimit: 5242880, // 5MB
                });
                
                if (createBucketError) {
                  console.error('Erreur lors de la création du bucket:', createBucketError);
                  toast({
                    title: 'Avertissement',
                    description: 'Impossible de créer le bucket de stockage. La formation sera créée sans image.',
                    variant: 'destructive',
                  });
                } else {
                  // Bucket créé avec succès, on peut continuer avec l'upload
                  const { error: uploadError, data } = await supabase.storage
                    .from('images')
                    .upload(filePath, selectedImage);
                  
                  if (uploadError) {
                    console.error('Erreur lors de l\'upload de l\'image:', uploadError);
                    toast({
                      title: 'Avertissement',
                      description: `Impossible d'uploader l'image: ${uploadError.message}. La formation sera créée sans image.`,
                      variant: 'destructive',
                    });
                  } else {
                    // Récupérer l'URL publique de l'image
                    const { data: { publicUrl } } = supabase.storage
                      .from('images')
                      .getPublicUrl(filePath);
                    
                    values.image_url = publicUrl;
                    toast({
                      title: 'Succès',
                      description: 'Image uploadée avec succès.',
                    });
                  }
                }
              } catch (createError: any) {
                console.error('Erreur lors de la création du bucket:', createError);
                toast({
                  title: 'Avertissement',
                  description: `Impossible de créer le bucket de stockage: ${createError.message}. La formation sera créée sans image.`,
                  variant: 'destructive',
                });
              }
            } else {
              // Uploader l'image
              const { error: uploadError, data } = await supabase.storage
                .from('images')
                .upload(filePath, selectedImage);
              
              if (uploadError) {
                console.error('Erreur lors de l\'upload de l\'image:', uploadError);
                toast({
                  title: 'Avertissement',
                  description: `Impossible d'uploader l'image: ${uploadError.message}. La formation sera créée sans image.`,
                  variant: 'destructive',
                });
              } else {
                // Récupérer l'URL publique de l'image
                const { data: { publicUrl } } = supabase.storage
                  .from('images')
                  .getPublicUrl(filePath);
                
                values.image_url = publicUrl;
                toast({
                  title: 'Succès',
                  description: 'Image uploadée avec succès.',
                });
              }
            }
          }
        } catch (uploadError: any) {
          console.error('Erreur lors du processus d\'upload:', uploadError);
          toast({
            title: 'Avertissement',
            description: `Problème avec l'upload d'image: ${uploadError.message}. La formation sera créée sans image.`,
            variant: 'destructive',
          });
        }
      }
      
      // Créer la formation dans la base de données
      const { error, data } = await supabase
        .from('formations')
        .insert([
          {
            title: values.title,
            description: values.description,
            price: values.price,
            published: values.published,
            image_url: values.image_url || null,
          },
        ])
        .select();
      
      if (error) {
        console.error('Erreur détaillée de Supabase:', error);
        throw new Error(`Erreur lors de la création: ${error.message} (Code: ${error.code})`);
      }
      
      if (!data || data.length === 0) {
        throw new Error('Aucune donnée retournée après la création');
      }
      
      toast({
        title: 'Formation créée',
        description: 'La formation a été créée avec succès.',
      });
      
      // Rediriger vers la liste des formations ou l'édition de la formation créée
      router.push(`/admin/formations/edit/${data[0].id}`);
      
    } catch (error: any) {
      console.error('Erreur lors de la création de la formation:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la création de la formation.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/formations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Créer une formation</h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>
              Renseignez les informations de base de la formation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form id="create-formation-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre</FormLabel>
                      <FormControl>
                        <Input placeholder="Titre de la formation" {...field} />
                      </FormControl>
                      <FormDescription>
                        Le titre doit être clair et concis
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Description détaillée de la formation"
                          className="min-h-32 resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Décrivez le contenu et les objectifs de la formation
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix (€)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="Prix de la formation"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Entrez 0 pour une formation gratuite
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="published"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Publier immédiatement</FormLabel>
                        <FormDescription>
                          Si non cochée, la formation sera enregistrée comme brouillon
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Button 
                    form="create-formation-form"
                    type="submit" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Créer la formation
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Image de couverture</CardTitle>
            <CardDescription>
              Ajoutez une image attrayante pour votre formation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center min-h-[200px] ${
                previewUrl ? 'border-primary/50 bg-primary/5' : 'border-gray-300 dark:border-gray-700'
              }`}
            >
              {previewUrl ? (
                <div className="relative w-full max-w-full">
                  <img
                    src={previewUrl}
                    alt="Prévisualisation"
                    className="rounded-md max-h-[300px] mx-auto object-contain"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setSelectedImage(null);
                      setPreviewUrl(null);
                      form.setValue('image_url', '');
                    }}
                  >
                    Supprimer
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center cursor-pointer space-y-2"
                >
                  <ImagePlus className="h-12 w-12 text-gray-400" />
                  <span className="font-medium text-sm">Cliquez pour ajouter une image</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG ou WEBP jusqu'à 5MB
                  </span>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Recommandations :</p>
              <ul className="list-disc pl-5 space-y-1 mt-1">
                <li>Format 16:9 pour un affichage optimal</li>
                <li>Résolution minimale recommandée : 1280x720 pixels</li>
                <li>Taille maximale : 5 MB</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 