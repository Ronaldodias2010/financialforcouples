import { useState } from "react";
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
import { Star, Loader2, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TestimonialFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TestimonialFormModal = ({ open, onOpenChange }: TestimonialFormModalProps) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: "couple",
    partnerName: "",
    testimonial: "",
    rating: 5,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.testimonial) {
      toast.error(t('testimonials.form.requiredFields'));
      return;
    }

    setLoading(true);

    try {
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
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('common.sending')}
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
