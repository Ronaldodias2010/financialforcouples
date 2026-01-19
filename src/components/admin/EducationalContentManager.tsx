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
import { Upload, FileText, Video, Image, Trash2, Eye, EyeOff } from "lucide-react";

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

      // Insert record into database
      const { error: insertError } = await supabase
        .from('educational_content')
        .insert({
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
          created_by_admin_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (insertError) throw insertError;

      toast({
        title: t('common.success'),
        description: t('admin.content.success.upload')
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t('admin.content.titleField')} *</label>
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
              <label className="text-sm font-medium mb-2 block">{t('admin.content.descriptionField')}</label>
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

            <Button type="submit" disabled={uploading} className="w-full">
              {uploading ? t('admin.content.uploading') : t('admin.content.addButton')}
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
                  <TableHead>{t('admin.content.table.status')}</TableHead>
                  <TableHead>{t('admin.content.table.date')}</TableHead>
                  <TableHead>{t('admin.content.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contents.map((content) => (
                  <TableRow key={content.id}>
                    <TableCell className="font-medium">{content.title}</TableCell>
                    <TableCell>{getCategoryLabel(content.category)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getContentTypeIcon(content.content_type)}
                        {content.content_type}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={content.is_active ? "default" : "secondary"}>
                        {content.is_active ? t('admin.content.status.active') : t('admin.content.status.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(content.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleContentStatus(content.id, content.is_active)}
                        >
                          {content.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteContent(content.id, content.file_url)}
                          className="text-destructive hover:text-destructive"
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