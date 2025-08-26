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
  file_url: string;
  file_name: string;
  file_type: string;
  content_type: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const categories = [
  { value: 'planning', label: 'Planejamento Financeiro' },
  { value: 'investments', label: 'Investimentos Básicos' },
  { value: 'emergency', label: 'Reserva de Emergência' },
  { value: 'analysis', label: 'Análise de Gastos' }
];

const contentTypes = [
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'video', label: 'Vídeo', icon: Video },
  { value: 'article', label: 'Artigo', icon: FileText },
  { value: 'image', label: 'Imagem', icon: Image }
];

export const EducationalContentManager = () => {
  const { t } = useLanguage();
  const [contents, setContents] = useState<EducationalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    content_type: '',
    sort_order: 0
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
        title: "Erro",
        description: "Erro ao carregar conteúdo educacional",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !formData.title || !formData.category || !formData.content_type) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${formData.category}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('educational-content')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('educational-content')
        .getPublicUrl(filePath);

      // Insert record into database
      const { error: insertError } = await supabase
        .from('educational_content')
        .insert({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          file_url: urlData.publicUrl,
          file_name: selectedFile.name,
          file_type: fileExt,
          content_type: formData.content_type,
          sort_order: formData.sort_order,
          created_by_admin_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (insertError) throw insertError;

      toast({
        title: "Sucesso",
        description: "Conteúdo educacional adicionado com sucesso"
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        content_type: '',
        sort_order: 0
      });
      setSelectedFile(null);
      
      // Refresh list
      fetchContents();

    } catch (error) {
      console.error('Error uploading content:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do conteúdo",
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
        title: "Sucesso",
        description: `Conteúdo ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`
      });
      
      fetchContents();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do conteúdo",
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
        title: "Sucesso",
        description: "Conteúdo excluído com sucesso"
      });
      
      fetchContents();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir conteúdo",
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
    return <div className="text-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Adicionar Conteúdo Educacional
          </CardTitle>
          <CardDescription>
            Faça upload de materiais educativos para usuários premium
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Título *</label>
                <Input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título do conteúdo"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Categoria *</label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
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
              <label className="text-sm font-medium mb-2 block">Descrição</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do conteúdo"
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Conteúdo *</label>
                <Select 
                  value={formData.content_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
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
                <label className="text-sm font-medium mb-2 block">Ordem de Exibição</label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Arquivo *</label>
              <Input
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.mp4,.webm,.mov,.avi,.jpg,.jpeg,.png,.gif,.webp"
                required
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  Arquivo selecionado: {selectedFile.name}
                </p>
              )}
            </div>

            <Button type="submit" disabled={uploading} className="w-full">
              {uploading ? "Fazendo upload..." : "Adicionar Conteúdo"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Content List */}
      <Card>
        <CardHeader>
          <CardTitle>Conteúdos Cadastrados</CardTitle>
          <CardDescription>
            Gerencie todo o conteúdo educacional disponível
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum conteúdo cadastrado ainda
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
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
                        {content.is_active ? "Ativo" : "Inativo"}
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