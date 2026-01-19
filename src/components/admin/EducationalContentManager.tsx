import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Upload, FileText, Video, Image, Trash2, Eye, EyeOff, Languages, Loader2, RefreshCw } from "lucide-react";

interface EducationalContent {
  id: string;
  title: string;
  description: string;
  category: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  content_type: string;
  image_url?: string;
  web_content?: string | null;
  // Multilingual fields
  title_pt?: string | null;
  title_en?: string | null;
  title_es?: string | null;
  description_pt?: string | null;
  description_en?: string | null;
  description_es?: string | null;
  web_content_pt?: string | null;
  web_content_en?: string | null;
  web_content_es?: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export const EducationalContentManager = () => {
  const { t } = useLanguage();
  
  const categories = [
    { value: 'planning', label: t('admin.content.categories.planning') },
    { value: 'investments', label: t('admin.content.categories.investments') },
    { value: 'emergency', label: t('admin.content.categories.emergency') },
    { value: 'analysis', label: t('admin.content.categories.analysis') }
  ];

  const contentTypes = [
    { value: 'pdf', label: t('admin.content.types.pdf'), icon: FileText },
    { value: 'video', label: t('admin.content.types.video'), icon: Video },
    { value: 'article', label: t('admin.content.types.article'), icon: FileText },
    { value: 'image', label: t('admin.content.types.image'), icon: Image }
  ];

  const [contents, setContents] = useState<EducationalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    content_type: '',
    sort_order: 0,
    web_content: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('educational_content')
        .select('*')
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error('Error fetching contents:', error);
      toast({
        title: t('common.error'),
        description: t('admin.content.error.load'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Auto-detect content type based on file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (['mp4', 'webm', 'mov', 'avi'].includes(extension || '')) {
        setFormData(prev => ({ ...prev, content_type: 'video' }));
      } else if (['pdf'].includes(extension || '')) {
        setFormData(prev => ({ ...prev, content_type: 'pdf' }));
      } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
        setFormData(prev => ({ ...prev, content_type: 'image' }));
      } else {
        setFormData(prev => ({ ...prev, content_type: 'article' }));
      }
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  // Translate content using edge function
  const translateContent = async (title: string, description?: string, webContent?: string) => {
    try {
      setTranslating(true);
      
      const { data, error } = await supabase.functions.invoke('translate-content', {
        body: {
          title,
          description: description || undefined,
          webContent: webContent || undefined,
          targetLanguages: ['en', 'es']
        }
      });

      if (error) {
        console.error('Translation error:', error);
        throw error;
      }

      return data.translations;
    } catch (error) {
      console.error('Translation failed:', error);
      // Return null to indicate translation failed, will use Portuguese as fallback
      return null;
    } finally {
      setTranslating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate: articles need web_content, other types need file
    const isArticle = formData.content_type === 'article';
    const hasWebContent = formData.web_content.trim().length > 0;
    const hasFile = !!selectedFile;
    
    if (!formData.title || !formData.category || !formData.content_type) {
      toast({
        title: t('common.error'),
        description: t('admin.content.error.fields'),
        variant: "destructive"
      });
      return;
    }
    
    // For articles, require web_content; for other types, require file
    if (isArticle && !hasWebContent) {
      toast({
        title: t('common.error'),
        description: t('admin.content.error.webContentRequired') || 'O conteúdo do artigo é obrigatório.',
        variant: "destructive"
      });
      return;
    }
    
    if (!isArticle && !hasFile) {
      toast({
        title: t('common.error'),
        description: t('admin.content.error.fields'),
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      let fileUrl = null;
      let fileName = null;
      let fileType = null;

      // Only upload file if one was selected (not for web articles)
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const generatedFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${formData.category}/${generatedFileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('educational-content')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('educational-content')
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileName = selectedFile.name;
        fileType = fileExt;
      }

      // Upload image if provided
      let imageUrl = null;
      if (selectedImage) {
        const imageExt = selectedImage.name.split('.').pop();
        const imageName = `${Date.now()}-image-${Math.random().toString(36).substring(2)}.${imageExt}`;
        const imagePath = `${formData.category}/images/${imageName}`;

        const { data: imageUploadData, error: imageUploadError } = await supabase.storage
          .from('educational-content')
          .upload(imagePath, selectedImage);

        if (imageUploadError) throw imageUploadError;

        const { data: imageUrlData } = supabase.storage
          .from('educational-content')
          .getPublicUrl(imagePath);

        imageUrl = imageUrlData.publicUrl;
      }

      // Translate content to EN and ES
      const translations = await translateContent(
        formData.title,
        formData.description,
        isArticle ? formData.web_content : undefined
      );

      // Insert record into database with all language versions
      const { error: insertError } = await supabase
        .from('educational_content')
        .insert({
          // Original fields (for backwards compatibility)
          title: formData.title,
          description: formData.description,
          category: formData.category,
          file_url: fileUrl,
          file_name: fileName,
          file_type: fileType,
          content_type: formData.content_type,
          image_url: imageUrl,
          web_content: isArticle ? formData.web_content : null,
          sort_order: formData.sort_order,
          created_by_admin_id: (await supabase.auth.getUser()).data.user?.id,
          // Portuguese (original)
          title_pt: formData.title,
          description_pt: formData.description || null,
          web_content_pt: isArticle ? formData.web_content : null,
          // English (translated)
          title_en: translations?.en?.title || formData.title,
          description_en: translations?.en?.description || formData.description || null,
          web_content_en: translations?.en?.webContent || (isArticle ? formData.web_content : null),
          // Spanish (translated)
          title_es: translations?.es?.title || formData.title,
          description_es: translations?.es?.description || formData.description || null,
          web_content_es: translations?.es?.webContent || (isArticle ? formData.web_content : null),
        });

      if (insertError) throw insertError;

      const translationStatus = translations 
        ? t('admin.content.success.uploadWithTranslation') || 'Conteúdo salvo e traduzido com sucesso!'
        : t('admin.content.success.uploadNoTranslation') || 'Conteúdo salvo (tradução pendente)';

      toast({
        title: t('common.success'),
        description: translationStatus
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        content_type: '',
        sort_order: 0,
        web_content: ''
      });
      setSelectedFile(null);
      setSelectedImage(null);
      
      // Refresh list
      fetchContents();

    } catch (error) {
      console.error('Error uploading content:', error);
      toast({
        title: t('common.error'),
        description: t('admin.content.error.upload'),
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Retranslate an existing content
  const retranslateContent = async (content: EducationalContent) => {
    try {
      setTranslating(true);
      
      const translations = await translateContent(
        content.title_pt || content.title,
        content.description_pt || content.description,
        content.web_content_pt || content.web_content || undefined
      );

      if (!translations) {
        toast({
          title: t('common.error'),
          description: t('admin.content.error.translation') || 'Falha ao traduzir. Tente novamente.',
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('educational_content')
        .update({
          title_en: translations.en?.title,
          description_en: translations.en?.description || null,
          web_content_en: translations.en?.webContent || null,
          title_es: translations.es?.title,
          description_es: translations.es?.description || null,
          web_content_es: translations.es?.webContent || null,
        })
        .eq('id', content.id);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('admin.content.success.retranslation') || 'Conteúdo retraduzido com sucesso!'
      });

      fetchContents();
    } catch (error) {
      console.error('Retranslation error:', error);
      toast({
        title: t('common.error'),
        description: t('admin.content.error.translation') || 'Falha ao traduzir.',
        variant: "destructive"
      });
    } finally {
      setTranslating(false);
    }
  };

  const toggleContentStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('educational_content')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: t('common.success'),
        description: t('admin.content.success.statusToggle')
      });
      
      fetchContents();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        title: t('common.error'),
        description: t('admin.content.error.statusToggle'),
        variant: "destructive"
      });
    }
  };

  const deleteContent = async (id: string, filePath: string) => {
    try {
      // Delete file from storage
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('educational-content')
          .remove([filePath]);
        
        if (storageError) console.error('Error deleting file:', storageError);
      }

      // Delete record from database
      const { error } = await supabase
        .from('educational_content')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: t('common.success'),
        description: t('admin.content.success.delete')
      });
      
      fetchContents();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: t('common.error'),
        description: t('admin.content.error.delete'),
        variant: "destructive"
      });
    }
  };

  const getCategoryLabel = (category: string) => {
    return categories.find(cat => cat.value === category)?.label || category;
  };

  const getContentTypeIcon = (contentType: string) => {
    const type = contentTypes.find(type => type.value === contentType);
    const Icon = type?.icon || FileText;
    return <Icon className="h-4 w-4" />;
  };

  // Check if content has translations
  const hasTranslations = (content: EducationalContent) => {
    return !!(content.title_en && content.title_es);
  };

  if (loading) {
    return <div className="text-center p-8">{t('admin.content.loading')}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t('admin.content.title')}
          </CardTitle>
          <CardDescription>
            {t('admin.content.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Auto-translation notice */}
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <Languages className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                {t('admin.content.autoTranslationNotice') || 'O conteúdo será traduzido automaticamente para inglês e espanhol.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('admin.content.titleField')} * 
                  <span className="text-xs text-muted-foreground ml-1">(Português)</span>
                </label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={t('admin.content.titlePlaceholder')}
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">{t('admin.content.category')} *</label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.content.categoryPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                {t('admin.content.descriptionField')}
                <span className="text-xs text-muted-foreground ml-1">(Português)</span>
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('admin.content.descriptionPlaceholder')}
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t('admin.content.contentType')} *</label>
                <Select 
                  value={formData.content_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('admin.content.contentTypePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">{t('admin.content.sortOrder')}</label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            {/* Web Content for Articles */}
            {formData.content_type === 'article' && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t('admin.content.webContent') || 'Conteúdo do Artigo'} *
                  <span className="text-xs text-muted-foreground ml-1">(Português)</span>
                </label>
                <Textarea
                  value={formData.web_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, web_content: e.target.value }))}
                  placeholder={t('admin.content.webContentPlaceholder') || 'Digite o conteúdo do artigo aqui...\n\nUse parágrafos separados por linha em branco para melhor formatação.'}
                  className="min-h-[300px] font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('admin.content.webContentHint') || 'Dica: Separe parágrafos com linha em branco para melhor visualização no blog.'}
                </p>
              </div>
            )}

            {/* File upload - only show for non-article types */}
            {formData.content_type !== 'article' && (
              <div>
                <label className="text-sm font-medium mb-2 block">{t('admin.content.file')} *</label>
                <Input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.mp4,.webm,.mov,.avi,.jpg,.jpeg,.png,.gif,.webp"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('admin.content.fileSelected')}: {selectedFile.name}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">{t('admin.content.image')} (opcional)</label>
              <Input
                type="file"
                onChange={handleImageSelect}
                accept=".jpg,.jpeg,.png,.gif,.webp"
              />
              {selectedImage && (
                <p className="text-sm text-muted-foreground mt-1">
                  {t('admin.content.imageSelected')}: {selectedImage.name}
                </p>
              )}
            </div>

            <Button type="submit" disabled={uploading || translating} className="w-full">
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('admin.content.uploading')}
                </>
              ) : translating ? (
                <>
                  <Languages className="h-4 w-4 mr-2 animate-pulse" />
                  {t('admin.content.translating') || 'Traduzindo...'}
                </>
              ) : (
                t('admin.content.addButton')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Content List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.content.listTitle')}</CardTitle>
          <CardDescription>
            {t('admin.content.listDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('admin.content.noContent')}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.content.table.title')}</TableHead>
                  <TableHead>{t('admin.content.table.category')}</TableHead>
                  <TableHead>{t('admin.content.table.type')}</TableHead>
                  <TableHead>{t('admin.content.translations') || 'Traduções'}</TableHead>
                  <TableHead>{t('admin.content.table.status')}</TableHead>
                  <TableHead>{t('admin.content.table.date')}</TableHead>
                  <TableHead>{t('admin.content.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contents.map((content) => (
                  <TableRow key={content.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {content.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryLabel(content.category)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getContentTypeIcon(content.content_type)}
                        <span className="capitalize">{content.content_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {hasTranslations(content) ? (
                          <>
                            <Badge variant="secondary" className="text-xs">🇧🇷</Badge>
                            <Badge variant="secondary" className="text-xs">🇺🇸</Badge>
                            <Badge variant="secondary" className="text-xs">🇪🇸</Badge>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-xs">🇧🇷 {t('admin.content.onlyPortuguese') || 'Apenas PT'}</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => retranslateContent(content)}
                          disabled={translating}
                          title={t('admin.content.retranslate') || 'Retraduzir'}
                        >
                          <RefreshCw className={`h-3 w-3 ${translating ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={content.is_active ? "default" : "secondary"}>
                        {content.is_active ? t('admin.content.active') : t('admin.content.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(content.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleContentStatus(content.id, content.is_active)}
                          title={content.is_active ? t('admin.content.deactivate') : t('admin.content.activate')}
                        >
                          {content.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteContent(content.id, content.file_url || '')}
                          className="text-destructive hover:text-destructive"
                          title={t('admin.content.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
