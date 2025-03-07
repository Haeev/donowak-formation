'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Upload, X, Check, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  website: string | null;
  location: string | null;
  job_title: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    bio: '',
    website: '',
    location: '',
    job_title: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      
      // Vérifier si l'utilisateur est connecté
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }
      
      // Récupérer les informations de l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (userError || !userData) {
        console.error('Erreur lors de la récupération des informations utilisateur:', userError);
        router.push('/auth/login');
        return;
      }
      
      setUser(userData as UserProfile);
      setFormData({
        full_name: userData.full_name || '',
        email: userData.email || session.user.email || '',
        phone: userData.phone || '',
        bio: userData.bio || '',
        website: userData.website || '',
        location: userData.location || '',
        job_title: userData.job_title || ''
      });
      
      setLoading(false);
    };
    
    fetchUserData();
  }, [router]);

  // Vérifier si l'URL contient l'ancre #delete pour ouvrir automatiquement la boîte de dialogue
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#delete') {
      // setIsDeleteDialogOpen(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      if (!user) throw new Error('Utilisateur non trouvé');
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          bio: formData.bio,
          website: formData.website,
          location: formData.location,
          job_title: formData.job_title,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Mettre à jour l'état local de l'utilisateur
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          full_name: formData.full_name,
          phone: formData.phone,
          bio: formData.bio,
          website: formData.website,
          location: formData.location,
          job_title: formData.job_title,
          updated_at: new Date().toISOString()
        };
      });
      
      setMessage({ 
        type: 'success', 
        text: 'Votre profil a été mis à jour avec succès.' 
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      setMessage({ 
        type: 'error', 
        text: 'Une erreur est survenue lors de la mise à jour de votre profil.' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    setUploadingAvatar(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Uploader l'image
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      // Mettre à jour le profil avec la nouvelle URL d'avatar
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);
      
      if (updateError) {
        throw updateError;
      }
      
      // Mettre à jour l'état local
      setUser(prev => {
        if (!prev) return null;
        return { ...prev, avatar_url: publicUrl };
      });
      
      setMessage({ 
        type: 'success', 
        text: 'Votre photo de profil a été mise à jour avec succès.' 
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'avatar:', error);
      setMessage({ 
        type: 'error', 
        text: 'Une erreur est survenue lors de la mise à jour de votre photo de profil.' 
      });
    } finally {
      setUploadingAvatar(false);
      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user || !user.avatar_url) return;
    
    setUploadingAvatar(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Mettre à jour le profil pour supprimer l'URL d'avatar
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Mettre à jour l'état local
      setUser(prev => {
        if (!prev) return null;
        return { ...prev, avatar_url: null };
      });
      
      setMessage({ 
        type: 'success', 
        text: 'Votre photo de profil a été supprimée avec succès.' 
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'avatar:', error);
      setMessage({ 
        type: 'error', 
        text: 'Une erreur est survenue lors de la suppression de votre photo de profil.' 
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Votre profil
          </h1>
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="flex items-center"
          >
            Retour au tableau de bord
          </Button>
        </div>

        {message.text && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'}`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-2" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </div>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="account">Compte</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Carte de profil avec avatar */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Photo de profil</CardTitle>
                  <CardDescription>
                    Votre photo sera affichée sur votre profil et dans vos commentaires.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div 
                    className="relative h-40 w-40 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mb-4 cursor-pointer"
                    onClick={handleAvatarClick}
                  >
                    {uploadingAvatar ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                      </div>
                    ) : user?.avatar_url ? (
                      <Image 
                        src={user.avatar_url} 
                        alt={user.full_name || 'Avatar'} 
                        fill 
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full">
                        <User className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleAvatarClick}
                      variant="outline"
                      size="sm"
                      disabled={uploadingAvatar}
                      className="flex items-center"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Changer
                    </Button>
                    
                    {user?.avatar_url && (
                      <Button 
                        onClick={handleRemoveAvatar}
                        variant="outline"
                        size="sm"
                        disabled={uploadingAvatar}
                        className="flex items-center text-red-500 hover:text-red-600"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Formulaire de profil */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>
                    Mettez à jour vos informations personnelles.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Nom complet</Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          placeholder="Votre nom complet"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          value={formData.email}
                          disabled
                          className="bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          L'email ne peut pas être modifié.
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Votre numéro de téléphone"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="job_title">Profession</Label>
                        <Input
                          id="job_title"
                          name="job_title"
                          value={formData.job_title}
                          onChange={handleChange}
                          placeholder="Votre profession"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="website">Site web</Label>
                        <Input
                          id="website"
                          name="website"
                          value={formData.website}
                          onChange={handleChange}
                          placeholder="https://votre-site.com"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="location">Localisation</Label>
                        <Input
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          placeholder="Ville, Pays"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Parlez-nous un peu de vous"
                        rows={4}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Cette bio sera visible sur votre profil public.
                      </p>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button
                    type="submit"
                    form="profile-form"
                    disabled={saving}
                    className="flex items-center"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      'Enregistrer les modifications'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres du compte</CardTitle>
                <CardDescription>
                  Gérez les paramètres de votre compte.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Email</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Votre adresse email actuelle est <strong>{formData.email}</strong>
                  </p>
                  <Button variant="outline" disabled>
                    Changer d'email
                  </Button>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Mot de passe</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Vous pouvez changer votre mot de passe à tout moment.
                  </p>
                  <Button variant="outline">
                    Changer de mot de passe
                  </Button>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Date d'inscription</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Vous êtes inscrit depuis le {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 