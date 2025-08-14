import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/landing/ui/button";
import useInView from "@/hooks/use-in-view";
import { Quote, Heart, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import coupleMariaCarlos from "@/assets/testimonials/couple-maria-carlos.jpg";
import coupleJoaoLucia from "@/assets/testimonials/couple-joao-lucia.jpg";
import singleRafael from "@/assets/testimonials/single-rafael.jpg";
import singleThiago from "@/assets/testimonials/single-thiago.jpg";

const TestimonialsSection = () => {
  const { ref, inView } = useInView({ threshold: 0.2 });
  const { t } = useLanguage();

  const testimonials = [
    {
      id: 1,
      type: 'couple',
      names: t('testimonials.couple1.names'),
      text: t('testimonials.couple1.text'),
      image: coupleMariaCarlos,
      rating: 5
    },
    {
      id: 2,
      type: 'couple',
      names: t('testimonials.couple2.names'),
      text: t('testimonials.couple2.text'),
      image: coupleJoaoLucia,
      rating: 5
    },
    {
      id: 3,
      type: 'single',
      names: t('testimonials.single1.name'),
      text: t('testimonials.single1.text'),
      image: singleRafael,
      rating: 5
    },
    {
      id: 4,
      type: 'single',
      names: t('testimonials.single2.name'),
      text: t('testimonials.single2.text'),
      image: singleThiago,
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
                      <div className="relative">
                        <Avatar className="w-16 h-16 border-2 border-background">
                          <AvatarImage src={testimonial.image} alt={testimonial.names} className="object-cover" />
                          <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                            {testimonial.names.split(' & ')[0][0]}{testimonial.names.split(' & ')[1][0]}
                          </AvatarFallback>
                        </Avatar>
                        <Heart className="absolute -bottom-1 -right-1 w-6 h-6 text-red-500 fill-red-500 bg-white rounded-full p-1" />
                      </div>
                    ) : (
                      <Avatar className="w-16 h-16 border-2 border-primary">
                        <AvatarImage src={testimonial.image} alt={testimonial.names} className="object-cover" />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {testimonial.names.split(' ')[0][0]}{testimonial.names.split(' ')[1][0]}
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
        </div>
        
        <div className="text-center mt-12">
          <Button
            onClick={() => {
              const subject = encodeURIComponent(t('testimonials.emailSubject'));
              const body = encodeURIComponent(t('testimonials.emailBody'));
              window.open(`mailto:contato@couplesfinancials.com?subject=${subject}&body=${body}`);
            }}
            className="px-8 py-3 text-lg font-semibold"
            variant="default"
          >
            {t('testimonials.leaveTestimonial')}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
