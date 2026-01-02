import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useInView from "@/hooks/use-in-view";
import { Quote, Heart, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import coupleMariaCarlos from "@/assets/testimonials/couple-maria-carlos.jpg";
import coupleJoaoLucia from "@/assets/testimonials/couple-joao-lucia.jpg";
import singleRafael from "@/assets/testimonials/single-rafael.jpg";
import singleThiago from "@/assets/testimonials/single-thiago.jpg";
import TestimonialInviteCard from "./TestimonialInviteCard";

interface Testimonial {
  id: string;
  type: 'couple' | 'single';
  names: string;
  text: string;
  image?: string;
  rating: number;
}

const TestimonialsSection = () => {
  const { ref, inView } = useInView({ threshold: 0.2 });
  const { t } = useLanguage();

  // Static testimonials (fallback)
  const staticTestimonials: Testimonial[] = [
    {
      id: 'static-1',
      type: 'couple',
      names: t('testimonials.couple1.names'),
      text: t('testimonials.couple1.text'),
      image: coupleMariaCarlos,
      rating: 5
    },
    {
      id: 'static-2',
      type: 'couple',
      names: t('testimonials.couple2.names'),
      text: t('testimonials.couple2.text'),
      image: coupleJoaoLucia,
      rating: 5
    },
    {
      id: 'static-3',
      type: 'single',
      names: t('testimonials.single1.name'),
      text: t('testimonials.single1.text'),
      image: singleRafael,
      rating: 5
    },
    {
      id: 'static-4',
      type: 'single',
      names: t('testimonials.single2.name'),
      text: t('testimonials.single2.text'),
      image: singleThiago,
      rating: 5
    }
  ];

  // Fetch approved testimonials from database (limit 9, oldest first for rotation)
  const { data: dbTestimonials } = useQuery({
    queryKey: ['approved-testimonials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('status', 'approved')
        .not('photo_url', 'is', null) // Only testimonials with photos
        .order('approved_at', { ascending: true }) // Oldest first (for rotation)
        .limit(9);
      
      if (error) {
        console.error('Error fetching testimonials:', error);
        return [];
      }
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Combine static and database testimonials (limit to 9 total)
  const allTestimonials: Testimonial[] = [
    // First show database testimonials (oldest approved first for rotation)
    ...(dbTestimonials?.map(t => ({
      id: t.id,
      type: (t.type === 'couple' ? 'couple' : 'single') as 'couple' | 'single',
      names: t.name,
      text: t.testimonial_text,
      image: t.photo_url || undefined,
      rating: t.rating || 5
    })) || []),
    // Then fill with static testimonials if needed
    ...staticTestimonials
  ].slice(0, 9); // Limit to 9 total

  return (
    <section className="py-20 bg-muted/30" aria-labelledby="testimonials-heading">
      <div className="container mx-auto px-4">
        <header ref={ref as unknown as React.RefObject<HTMLDivElement> as any} className={`text-center mb-16 ${inView ? 'animate-fade-in' : 'opacity-0'}`}>
          <h2 id="testimonials-heading" className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t('testimonials.title')} <span className="bg-hero-gradient bg-clip-text text-transparent">{t('testimonials.subtitle')}</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('testimonials.description')}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {allTestimonials.map((testimonial, index) => (
            <Card key={testimonial.id} className={`relative border-2 bg-card hover:shadow-elegant transition-all duration-300 ${inView ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: `${index * 100}ms` }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {testimonial.type === 'couple' ? (
                      <div className="relative">
                        <Avatar className="w-16 h-16 border-2 border-background">
                          {testimonial.image ? (
                            <AvatarImage src={testimonial.image} alt={testimonial.names} className="object-cover" />
                          ) : null}
                          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                            {testimonial.names.includes('&') 
                              ? `${testimonial.names.split(' & ')[0][0]}${testimonial.names.split(' & ')[1]?.[0] || ''}`
                              : testimonial.names.slice(0, 2).toUpperCase()
                            }
                          </AvatarFallback>
                        </Avatar>
                        <Heart className="absolute -bottom-1 -right-1 w-6 h-6 text-red-500 fill-red-500 bg-white rounded-full p-1" />
                      </div>
                    ) : (
                      <Avatar className="w-16 h-16 border-2 border-primary">
                        {testimonial.image ? (
                          <AvatarImage src={testimonial.image} alt={testimonial.names} className="object-cover" />
                        ) : null}
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {testimonial.names.split(' ').slice(0, 2).map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground">{testimonial.names}</h3>
                      <div className="flex items-center gap-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <Quote className="absolute -top-2 -left-2 w-8 h-8 text-primary/20" />
                  <p className="text-muted-foreground italic leading-relaxed pl-6">
                    "{testimonial.text}"
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Card de convite para enviar depoimento */}
          <TestimonialInviteCard 
            className={`${inView ? 'animate-fade-in' : 'opacity-0'}`}
            style={{ animationDelay: `${allTestimonials.length * 100}ms` }}
          />
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
