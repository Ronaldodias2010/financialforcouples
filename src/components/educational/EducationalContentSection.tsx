import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, FileText, Video, Image, Download, Lock, Eye } from "lucide-react";
import { ContentViewer } from "./ContentViewer";

interface EducationalContent {
  id: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  file_name: string;
  file_type: string;
  content_type: string;
  image_url?: string;
  created_at: string;
}

export const EducationalContentSection = () => {
  const { t } = useLanguage();
  const { hasAccess } = useSubscription();
  
  const categories = [
    { 
      value: 'planning', 
      label: t('admin.content.categories.planning'),
      description: t('educational.categories.planningDesc'),
      icon: '📊'
    },
    { 
      value: 'investments', 
      label: t('admin.content.categories.investments'),
      description: t('educational.categories.investmentsDesc'),
      icon: '📈'
    },
    { 
      value: 'emergency', 
      label: t('admin.content.categories.emergency'),
      description: t('educational.categories.emergencyDesc'),
      icon: '🛡️'
    },
    { 
      value: 'analysis', 
      label: t('admin.content.categories.analysis'),
      description: t('educational.categories.analysisDesc'),
      icon: '🔍'
    }
  ];
  const [contents, setContents] = useState<EducationalContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('planning');
  const [selectedContent, setSelectedContent] = useState<EducationalContent | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const isPremium = hasAccess('premium');

  useEffect(() => {
    if (isPremium) {
      fetchContents();
    } else {
      setLoading(false);
    }
  }, [isPremium]);

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('educational_content')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setContents(data || []);
    } catch (error) {
      console.error('Error fetching educational content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'image':
        return <Image className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getContentsByCategory = (category: string) => {
    return contents.filter(content => content.category === category);
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewContent = (content: EducationalContent) => {
    setSelectedContent(content);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setSelectedContent(null);
  };

  if (!isPremium) {
    return (
      <Card className="border-2 border-dashed border-primary/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t('aiRecommendations.educationalContent')}
          </CardTitle>
          <CardDescription>
            {t('educational.exclusiveContent')}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            {t('educational.accessMaterials')}
          </p>
          <Button className="bg-gradient-to-r from-primary to-primary-glow">
            {t('educational.upgradeToPremium')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">{t('educational.loading')}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          {t('aiRecommendations.educationalContent')}
        </CardTitle>
        <CardDescription>
          {t('educational.materialsDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
            {categories.map((category) => (
              <TabsTrigger 
                key={category.value} 
                value={category.value} 
                className="text-[10px] sm:text-xs px-1 sm:px-3 py-1 sm:py-2 h-auto min-h-[2rem] sm:min-h-[2.5rem] flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1"
              >
                <span className="text-xs sm:text-sm">{category.icon}</span>
                <span className="hidden xs:block sm:hidden">{category.label.split(' ')[0]}</span>
                <span className="hidden sm:block">{category.label.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.value} value={category.value} className="mt-6">
              <div className="space-y-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold text-lg flex items-center justify-center gap-2 mb-2">
                    {category.icon} {category.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </div>

                {getContentsByCategory(category.value).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('educational.noContent')}</p>
                    <p className="text-sm">{t('educational.newMaterials')}</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {getContentsByCategory(category.value).map((content) => (
                      <Card key={content.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {content.image_url && (
                              <div className="flex-shrink-0">
                                <img 
                                  src={content.image_url} 
                                  alt={content.title}
                                  className="w-24 h-24 object-cover rounded-lg border border-border/20"
                                />
                              </div>
                            )}
                            
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    {getContentIcon(content.content_type)}
                                    <h4 className="font-semibold">{content.title}</h4>
                                    <Badge variant="secondary" className="text-xs">
                                      {content.content_type}
                                    </Badge>
                                  </div>
                                  
                                  {content.description && (
                                    <p className="text-sm text-muted-foreground mb-3">
                                      {content.description}
                                    </p>
                                  )}
                                  
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>📅 {new Date(content.created_at).toLocaleDateString(
                                      t('common.locale') || 'pt-BR'
                                    )}</span>
                                    <span>📄 {content.file_name}</span>
                                  </div>
                                </div>
                                
                                <div className="ml-4 flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleViewContent(content)}
                                    className="bg-gradient-to-r from-blue-500 to-blue-600"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    {t('educational.view')}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDownload(content.file_url, content.file_name)}
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    {t('educational.download')}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>

      <ContentViewer
        isOpen={viewerOpen}
        onClose={closeViewer}
        content={selectedContent}
      />
    </Card>
  );
};