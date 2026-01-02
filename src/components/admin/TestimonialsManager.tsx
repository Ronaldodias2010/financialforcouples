import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Star, 
  Check, 
  X, 
  Trash2, 
  Eye, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Plus,
  Loader2,
  MessageSquare,
  Mail,
  Calendar,
  Heart,
  User
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

interface Testimonial {
  id: string;
  name: string;
  email: string | null;
  testimonial_text: string;
  photo_url: string | null;
  type: string | null;
  rating: number | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
}

const TestimonialsManager = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [newTestimonial, setNewTestimonial] = useState({
    name: "",
    email: "",
    type: "couple",
    testimonial_text: "",
    rating: 5,
    status: "approved",
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      toast.error(t('admin.testimonials.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(t('admin.testimonials.approveSuccess'));
      fetchTestimonials();
    } catch (error) {
      console.error('Error approving testimonial:', error);
      toast.error(t('admin.testimonials.approveError'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(t('admin.testimonials.rejectSuccess'));
      fetchTestimonials();
    } catch (error) {
      console.error('Error rejecting testimonial:', error);
      toast.error(t('admin.testimonials.rejectError'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!testimonialToDelete) return;
    
    setActionLoading(testimonialToDelete);
    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', testimonialToDelete);

      if (error) throw error;
      
      toast.success(t('admin.testimonials.deleteSuccess'));
      setDeleteDialogOpen(false);
      setTestimonialToDelete(null);
      fetchTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast.error(t('admin.testimonials.deleteError'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddTestimonial = async () => {
    if (!newTestimonial.name || !newTestimonial.testimonial_text) {
      toast.error(t('testimonials.form.requiredFields'));
      return;
    }

    setActionLoading('add');
    try {
      const { error } = await supabase
        .from('testimonials')
        .insert({
          name: newTestimonial.name,
          email: newTestimonial.email || null,
          type: newTestimonial.type,
          testimonial_text: newTestimonial.testimonial_text,
          rating: newTestimonial.rating,
          status: newTestimonial.status,
          approved_at: newTestimonial.status === 'approved' ? new Date().toISOString() : null,
          approved_by: newTestimonial.status === 'approved' ? user?.id : null,
        });

      if (error) throw error;
      
      toast.success(t('admin.testimonials.addSuccess'));
      setAddDialogOpen(false);
      setNewTestimonial({
        name: "",
        email: "",
        type: "couple",
        testimonial_text: "",
        rating: 5,
        status: "approved",
      });
      fetchTestimonials();
    } catch (error) {
      console.error('Error adding testimonial:', error);
      toast.error(t('admin.testimonials.addError'));
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />{t('admin.testimonials.approved')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />{t('admin.testimonials.rejected')}</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{t('admin.testimonials.pending')}</Badge>;
    }
  };

  const getTypeBadge = (type: string | null) => {
    if (type === 'couple') {
      return <Badge variant="outline" className="border-pink-500 text-pink-500"><Heart className="w-3 h-3 mr-1" />{t('testimonials.form.typeCouple')}</Badge>;
    }
    return <Badge variant="outline"><User className="w-3 h-3 mr-1" />{t('testimonials.form.typeSingle')}</Badge>;
  };

  const filterByStatus = (status: string) => {
    if (status === 'all') return testimonials;
    return testimonials.filter(t => t.status === status);
  };

  const pendingCount = testimonials.filter(t => t.status === 'pending').length;
  const approvedCount = testimonials.filter(t => t.status === 'approved').length;
  const rejectedCount = testimonials.filter(t => t.status === 'rejected').length;

  const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="w-12 h-12">
              {testimonial.photo_url ? (
                <AvatarImage src={testimonial.photo_url} alt={testimonial.name} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {testimonial.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                {getTypeBadge(testimonial.type)}
                {getStatusBadge(testimonial.status)}
              </div>
              {testimonial.email && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Mail className="w-3 h-3" />
                  {testimonial.email}
                </p>
              )}
              <div className="flex items-center gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < (testimonial.rating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                "{testimonial.testimonial_text}"
              </p>
              {testimonial.created_at && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(testimonial.created_at), 'dd/MM/yyyy HH:mm')}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedTestimonial(testimonial);
                setViewDialogOpen(true);
              }}
            >
              <Eye className="w-4 h-4" />
            </Button>
            {testimonial.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(testimonial.id)}
                  disabled={actionLoading === testimonial.id}
                >
                  {actionLoading === testimonial.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleReject(testimonial.id)}
                  disabled={actionLoading === testimonial.id}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                setTestimonialToDelete(testimonial.id);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            {t('admin.testimonials.title')}
          </h2>
          <p className="text-muted-foreground">{t('admin.testimonials.subtitle')}</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('admin.testimonials.addManual')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-500/10">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">{t('admin.testimonials.pending')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/10">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{approvedCount}</p>
              <p className="text-sm text-muted-foreground">{t('admin.testimonials.approved')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-500/10">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{rejectedCount}</p>
              <p className="text-sm text-muted-foreground">{t('admin.testimonials.rejected')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" />
            {t('admin.testimonials.pending')} ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {t('admin.testimonials.approved')} ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="w-4 h-4" />
            {t('admin.testimonials.rejected')} ({rejectedCount})
          </TabsTrigger>
        </TabsList>

        {['pending', 'approved', 'rejected'].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {filterByStatus(status).length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  {t('admin.testimonials.noTestimonials')}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filterByStatus(status).map((testimonial) => (
                  <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('admin.testimonials.viewTitle')}</DialogTitle>
          </DialogHeader>
          {selectedTestimonial && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  {selectedTestimonial.photo_url ? (
                    <AvatarImage src={selectedTestimonial.photo_url} alt={selectedTestimonial.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                    {selectedTestimonial.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedTestimonial.name}</h3>
                  {selectedTestimonial.email && (
                    <p className="text-sm text-muted-foreground">{selectedTestimonial.email}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {getTypeBadge(selectedTestimonial.type)}
                    {getStatusBadge(selectedTestimonial.status)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < (selectedTestimonial.rating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="italic">"{selectedTestimonial.testimonial_text}"</p>
              </div>
              {selectedTestimonial.created_at && (
                <p className="text-sm text-muted-foreground">
                  {t('admin.testimonials.receivedAt')}: {format(new Date(selectedTestimonial.created_at), 'dd/MM/yyyy HH:mm')}
                </p>
              )}
              {selectedTestimonial.approved_at && (
                <p className="text-sm text-muted-foreground">
                  {t('admin.testimonials.approvedAt')}: {format(new Date(selectedTestimonial.approved_at), 'dd/MM/yyyy HH:mm')}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('admin.testimonials.addManual')}</DialogTitle>
            <DialogDescription>{t('admin.testimonials.addDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('testimonials.form.name')} *</Label>
              <Input
                value={newTestimonial.name}
                onChange={(e) => setNewTestimonial(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('testimonials.form.namePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('testimonials.form.email')}</Label>
              <Input
                type="email"
                value={newTestimonial.email}
                onChange={(e) => setNewTestimonial(prev => ({ ...prev, email: e.target.value }))}
                placeholder={t('testimonials.form.emailPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('testimonials.form.type')}</Label>
              <Select
                value={newTestimonial.type}
                onValueChange={(value) => setNewTestimonial(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="couple">{t('testimonials.form.typeCouple')}</SelectItem>
                  <SelectItem value="single">{t('testimonials.form.typeSingle')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('testimonials.form.message')} *</Label>
              <Textarea
                value={newTestimonial.testimonial_text}
                onChange={(e) => setNewTestimonial(prev => ({ ...prev, testimonial_text: e.target.value }))}
                placeholder={t('testimonials.form.messagePlaceholder')}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('testimonials.form.rating')}</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewTestimonial(prev => ({ ...prev, rating: star }))}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= newTestimonial.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('admin.testimonials.initialStatus')}</Label>
              <Select
                value={newTestimonial.status}
                onValueChange={(value) => setNewTestimonial(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">{t('admin.testimonials.approved')}</SelectItem>
                  <SelectItem value="pending">{t('admin.testimonials.pending')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddTestimonial} disabled={actionLoading === 'add'}>
              {actionLoading === 'add' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.testimonials.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.testimonials.deleteConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading === testimonialToDelete ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TestimonialsManager;
