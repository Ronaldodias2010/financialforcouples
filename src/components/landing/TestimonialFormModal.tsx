import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/landing/ui/dialog";
import { Button } from "@/components/landing/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Loader2, CheckCircle2, Upload, X, LogIn } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface TestimonialFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TestimonialFormModal = ({ open, onOpenChange }: TestimonialFormModalProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: "couple",
    partnerName: "",
    testimonial: "",
    rating: 5,
  });

  // Pre-fill email from logged user
  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: user.email || "" }));
    }
  }, [user?.email]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(t('testimonials.form.photoInvalidType'));
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('testimonials.form.photoTooLarge'));
        return;
      }
      setPhotoFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `testimonials/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error(t('testimonials.form.loginRequired'));
      return;
    }

    if (!formData.name || !formData.email || !formData.testimonial) {
      toast.error(t('testimonials.form.requiredFields'));
      return;
    }

    if (!photoFile) {
      toast.error(t('testimonials.form.photoRequired'));
      return;
    }

    setLoading(true);

    try {
      // Upload photo first
      const photoUrl = await uploadPhoto(photoFile);
      if (!photoUrl) {
        throw new Error('Failed to upload photo');
      }

      const displayName = formData.type === 'couple' && formData.partnerName 
        ? `${formData.name} & ${formData.partnerName}`
        : formData.name;

      const { error } = await supabase
        .from('testimonials')
        .insert({
          name: displayName,
          email: formData.email,
          type: formData.type,
          testimonial_text: formData.testimonial,
          rating: formData.rating,
          photo_url: photoUrl,
          status: 'pending',
        });

      if (error) throw error;

      setSuccess(true);
      toast.success(t('testimonials.form.success'));
      
      // Reset form after 2 seconds and close
      setTimeout(() => {
        setFormData({
          name: "",
          email: "",
          type: "couple",
          partnerName: "",
          testimonial: "",
          rating: 5,
        });
        setPhotoFile(null);
        setPhotoPreview(null);
        setSuccess(false);
        onOpenChange(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      toast.error(t('testimonials.form.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleLogin = () => {
    onOpenChange(false);
    navigate('/login');
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {t('testimonials.form.success')}
            </h3>
            <p className="text-muted-foreground">
              {t('testimonials.form.successDescription')}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show login required message if not authenticated
  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <LogIn className="w-16 h-16 text-primary mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {t('testimonials.form.loginRequiredTitle')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t('testimonials.form.loginRequiredDescription')}
            </p>
            <Button onClick={handleLogin} className="w-full">
              <LogIn className="w-4 h-4 mr-2" />
              {t('testimonials.form.goToLogin')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('testimonials.form.title')}</DialogTitle>
          <DialogDescription>
            {t('testimonials.form.subtitle')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Photo Upload (Required) */}
          <div className="space-y-2">
            <Label>{t('testimonials.form.photo')} *</Label>
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <div className="relative">
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/80"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground/50 flex flex-col items-center justify-center gap-1 hover:border-primary transition-colors"
                >
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{t('testimonials.form.uploadPhoto')}</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground">
                {t('testimonials.form.photoHint')}
              </p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t('testimonials.form.name')} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('testimonials.form.namePlaceholder')}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">{t('testimonials.form.email')} *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder={t('testimonials.form.emailPlaceholder')}
              required
            />
          </div>

          {/* Account Type */}
          <div className="space-y-2">
            <Label>{t('testimonials.form.type')}</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
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

          {/* Partner Name (only for couples) */}
          {formData.type === 'couple' && (
            <div className="space-y-2">
              <Label htmlFor="partnerName">{t('testimonials.form.partnerName')}</Label>
              <Input
                id="partnerName"
                value={formData.partnerName}
                onChange={(e) => setFormData(prev => ({ ...prev, partnerName: e.target.value }))}
                placeholder={t('testimonials.form.partnerNamePlaceholder')}
              />
            </div>
          )}

          {/* Testimonial Text */}
          <div className="space-y-2">
            <Label htmlFor="testimonial">{t('testimonials.form.message')} *</Label>
            <Textarea
              id="testimonial"
              value={formData.testimonial}
              onChange={(e) => setFormData(prev => ({ ...prev, testimonial: e.target.value }))}
              placeholder={t('testimonials.form.messagePlaceholder')}
              rows={4}
              required
            />
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>{t('testimonials.form.rating')}</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= formData.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || uploading || !photoFile}
          >
            {loading || uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {uploading ? t('testimonials.form.uploading') : t('common.sending')}
              </>
            ) : (
              t('testimonials.form.submit')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TestimonialFormModal;
