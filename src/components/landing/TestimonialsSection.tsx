import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import useInView from "@/hooks/use-in-view";
import { Play } from "lucide-react";
import heroCouple from "@/assets/hero-couple.jpg";

const TestimonialsSection = () => {
  const { ref, inView } = useInView({ threshold: 0.2 });

  return (
    <section className="py-20 bg-background" aria-labelledby="video-testimonials-heading">
      <div className="container mx-auto px-4">
        <header ref={ref as unknown as React.RefObject<HTMLDivElement> as any} className={`text-center mb-12 ${inView ? 'animate-fade-in' : 'opacity-0'}`}>
          <h2 id="video-testimonials-heading" className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Depoimentos em Vídeo <span className="bg-hero-gradient bg-clip-text text-transparent">Casais Reais</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Aumente a confiança com histórias reais de quem já usa.
          </p>
        </header>

        <Card className="max-w-3xl mx-auto border-2">
          <AspectRatio ratio={16 / 9}>
            <div className="relative w-full h-full overflow-hidden rounded-lg bg-muted">
              <img
                src={heroCouple}
                alt="Capa ilustrativa do depoimento em vídeo de um casal real"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-40"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />

              <div className="relative z-10 h-full w-full flex items-center justify-center">
                <button
                  type="button"
                  aria-label="Reproduzir depoimento em vídeo"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground shadow-elegant hover-scale"
                  disabled
                >
                  <Play className="w-5 h-5" />
                  Em breve: vídeo de depoimento
                </button>
              </div>
            </div>
          </AspectRatio>
        </Card>
      </div>
    </section>
  );
};

export default TestimonialsSection;
