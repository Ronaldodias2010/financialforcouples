import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
interface FAQItem {
  question: string;
  answer: string;
  icon: string;
}

const faqData = {
  pt: [
    {
      question: "O que é o Couples Financials?",
      answer: "Couples Financials é uma plataforma de gestão financeira colaborativa para casais. Ela permite acompanhar despesas, definir metas, compartilhar decisões e automatizar tarefas financeiras.",
      icon: "❓"
    },
    {
      question: "Como funciona o login com senha temporária?",
      answer: "Quando um usuário é convidado, o sistema envia uma senha temporária válida por 7 dias. Ao fazer login, ele será redirecionado para uma tela obrigatória de troca de senha. Após isso, será necessário fazer login novamente com a nova senha.",
      icon: "🔐"
    },
    {
      question: "Meus dados estão seguros?",
      answer: "Sim. Utilizamos Supabase como banco de dados, com criptografia em repouso e em trânsito. Toda a infraestrutura é hospedada na AWS, com práticas avançadas de segurança.",
      icon: "🧠"
    },
    {
      question: "Posso usar o sistema offline?",
      answer: "Sim, se você instalar o Couples Financials como PWA (Progressive Web App), poderá acessar dados previamente sincronizados mesmo sem conexão.",
      icon: "🔄"
    },
    {
      question: "Posso integrar com outros sistemas?",
      answer: "Sim. O Couples Financials está preparado para receber automações via APIs, permitindo integração com CRMs, planilhas, e outros serviços.",
      icon: "🤝"
    },
    {
      question: "O sistema é gratuito?",
      answer: "Oferecemos uma versão gratuita com recursos essenciais. Planos pagos estão disponíveis para quem deseja funcionalidades avançadas e maior capacidade de armazenamento.",
      icon: "🧾"
    }
  ],
  en: [
    {
      question: "What is Couples Financials?",
      answer: "Couples Financials is a collaborative financial management platform for couples. It helps track expenses, set goals, share decisions, and automate financial tasks.",
      icon: "❓"
    },
    {
      question: "How does temporary password login work?",
      answer: "When a user is invited, the system sends a temporary password valid for 7 days. Upon login, they are redirected to a mandatory password change screen. After updating, they must log in again with the new password.",
      icon: "🔐"
    },
    {
      question: "Is my data secure?",
      answer: "Yes. We use Supabase for data storage with encryption at rest and in transit. The entire infrastructure is hosted on AWS with advanced security practices.",
      icon: "🧠"
    },
    {
      question: "Can I use the system offline?",
      answer: "Yes. If you install Couples Financials as a PWA (Progressive Web App), you can access previously synced data even without an internet connection.",
      icon: "🔄"
    },
    {
      question: "Can I integrate with other systems?",
      answer: "Yes. Couples Financials is ready to receive automations via APIs, allowing integration with CRMs, spreadsheets, and other services.",
      icon: "🤝"
    },
    {
      question: "Is the system free?",
      answer: "We offer a free version with essential features. Paid plans are available for users who need advanced functionality and increased storage.",
      icon: "🧾"
    }
  ],
  es: [
    {
      question: "¿Qué es Couples Financials?",
      answer: "Couples Financials es una plataforma de gestión financiera colaborativa para parejas. Permite rastrear gastos, definir metas, compartir decisiones y automatizar tareas financieras.",
      icon: "❓"
    },
    {
      question: "¿Cómo funciona el login con contraseña temporal?",
      answer: "Cuando se invita a un usuario, el sistema envía una contraseña temporal válida por 7 días. Al iniciar sesión, será redirigido a una pantalla obligatoria de cambio de contraseña. Después, deberá iniciar sesión nuevamente con la nueva contraseña.",
      icon: "🔐"
    },
    {
      question: "¿Están seguros mis datos?",
      answer: "Sí. Utilizamos Supabase como base de datos, con encriptación en reposo y en tránsito. Toda la infraestructura está alojada en AWS, con prácticas avanzadas de seguridad.",
      icon: "🧠"
    },
    {
      question: "¿Puedo usar el sistema sin conexión?",
      answer: "Sí, si instalas Couples Financials como PWA (Progressive Web App), podrás acceder a datos previamente sincronizados incluso sin conexión.",
      icon: "🔄"
    },
    {
      question: "¿Puedo integrar con otros sistemas?",
      answer: "Sí. Couples Financials está preparado para recibir automatizaciones vía APIs, permitiendo integración con CRMs, hojas de cálculo y otros servicios.",
      icon: "🤝"
    },
    {
      question: "¿Es gratuito el sistema?",
      answer: "Ofrecemos una versión gratuita con recursos esenciales. Planes pagos están disponibles para quienes desean funcionalidades avanzadas y mayor capacidad de almacenamiento.",
      icon: "🧾"
    }
  ]
};

const FAQItem = ({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden transition-all duration-300 hover:border-slate-600/50">
      <button
        onClick={onToggle}
        className="w-full p-6 text-left flex items-center justify-between group transition-colors duration-200 hover:bg-slate-700/30"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{item.icon}</span>
          <h3 className="text-lg font-semibold text-slate-100 group-hover:text-white transition-colors">
            {item.question}
          </h3>
        </div>
        <ChevronDown 
          className={cn(
            "h-5 w-5 text-slate-400 transition-transform duration-300",
            isOpen && "rotate-180"
          )}
        />
      </button>
      
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="px-6 pb-6 pt-0">
          <div className="pl-11">
            <p className="text-slate-300 leading-relaxed">
              {item.answer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const FAQSection = () => {
  const { language } = useLanguage();
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const currentFAQ = faqData[language] || faqData['en'];

  return (
    <section className="py-24 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {language === 'pt' ? 'FAQ – Couples Financials' : 
             language === 'es' ? 'Preguntas Frecuentes – Couples Financials' : 
             'FAQ – Couples Financials'}
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            {language === 'pt' 
              ? 'Encontre respostas para as perguntas mais frequentes sobre nossa plataforma.'
              : language === 'es'
              ? 'Encuentra respuestas a las preguntas más frecuentes sobre nuestra plataforma.'
              : 'Find answers to the most frequently asked questions about our platform.'
            }
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {currentFAQ.map((item, index) => (
            <FAQItem
              key={`${language}-${index}`}
              item={item}
              isOpen={openItems.has(index)}
              onToggle={() => toggleItem(index)}
            />
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-16 text-center">
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
            <h3 className="text-2xl font-bold text-white mb-4">
              {language === 'pt' 
                ? 'Ainda tem dúvidas?'
                : language === 'es'
                ? '¿Aún tienes dudas?'
                : 'Still have questions?'
              }
            </h3>
            <p className="text-slate-300 mb-6">
              {language === 'pt'
                ? 'Nossa equipe está sempre pronta para ajudar você.'
                : language === 'es'
                ? 'Nuestro equipo está siempre listo para ayudarte.'
                : 'Our team is always ready to help you.'
              }
            </p>
            <Button asChild variant="ctaGradient" size="lg" className="font-semibold">
              <a href="mailto:suporte@couplesfinancials.com" className="inline-flex items-center gap-2">
                <span>📧</span>
                {language === 'pt' ? 'Entrar em contato' : language === 'es' ? 'Contactar' : 'Contact us'}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;