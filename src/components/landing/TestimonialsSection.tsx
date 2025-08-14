import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useInView from "@/hooks/use-in-view";
import { Quote, Heart, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const TestimonialsSection = () => {
  const { ref, inView } = useInView({ threshold: 0.2 });
  const { t } = useLanguage();

  const testimonials = [
    {
      id: 1,
      type: 'couple',
      names: t('testimonials.couple1.names'),
      text: t('testimonials.couple1.text'),
      avatar1: "MA",
      avatar2: "CR",
      rating: 5
    },
    {
      id: 2,
      type: 'couple',
      names: t('testimonials.couple2.names'),
      text: t('testimonials.couple2.text'),
      avatar1: "JS",
      avatar2: "LP",
      rating: 5
    },
    {
      id: 3,
      type: 'single',
      names: t('testimonials.single1.name'),
      text: t('testimonials.single1.text'),
      avatar1: "RF",
      rating: 5
    },
    {
      id: 4,
      type: 'single',
      names: t('testimonials.single2.name'),
      text: t('testimonials.single2.text'),
      avatar1: "TC",
      rating: 5
    }
  ];

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={testimonial.id} className={`relative border-2 bg-card hover:shadow-elegant transition-all duration-300 ${inView ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: `${index * 100}ms` }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {testimonial.type === 'couple' ? (
                      <div className="flex -space-x-2">
                        <Avatar className="border-2 border-background">
                          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                            {testimonial.avatar1}
                          </AvatarFallback>
                        </Avatar>
                        <Avatar className="border-2 border-background">
                          <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                            {testimonial.avatar2}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    ) : (
                      <Avatar className="border-2 border-primary">
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {testimonial.avatar1}
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
                  {testimonial.type === 'couple' && (
                    <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                  )}
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
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
