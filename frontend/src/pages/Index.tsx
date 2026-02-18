import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Shield,
  Users,
  Star,
  ArrowRight,
  CheckCircle,
  Hammer,
  FileText,
  MessageSquare,
  ShoppingBag,
  Wrench,
  Zap,
  Layers,
  Palette,
  Home,
  Quote,
} from 'lucide-react';
import { client } from '@/lib/api';

gsap.registerPlugin(ScrollTrigger);

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '573001234567';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const scopeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const scope = scopeRef.current;
      if (!scope) return;

      // Hero: staggered fade-up
      const heroBadge = scope.querySelector('.hero-badge');
      const heroTitle = scope.querySelector('.hero-title');
      const heroDesc = scope.querySelector('.hero-desc');
      const heroBtns = scope.querySelector('.hero-btns');
      const heroImg = scope.querySelector('.hero-img');
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo(heroBadge, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6 })
        .fromTo(heroTitle, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.3')
        .fromTo(heroDesc, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
        .fromTo(heroBtns, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.3')
        .fromTo(heroImg, { opacity: 0, scale: 0.96, x: 24 }, { opacity: 1, scale: 1, x: 0, duration: 0.9 }, '-=0.8');

      // Hero image: continuous gentle float
      if (heroImg) {
        gsap.to(heroImg, {
          y: -12,
          duration: 2.8,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: 1.2,
        });
      }

      // Hero glow behind image: subtle pulse
      const heroGlow = scope.querySelector('.hero-glow');
      if (heroGlow) {
        gsap.to(heroGlow, {
          scale: 1.08,
          opacity: 0.4,
          duration: 2.5,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: 1.5,
        });
      }

      // Header: subtle slide-down on load
      const header = scope.querySelector('.lp-header');
      gsap.fromTo(header, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: 'power2.out' });

      // Scroll-triggered section reveals — replay every time section enters view
      const sections = scope.querySelectorAll('.lp-reveal');
      const playReveal = (el: Element) => {
        gsap.killTweensOf(el);
        gsap.fromTo(el, { opacity: 0, y: 56 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
      };
      sections.forEach((section) => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top 85%',
          onEnter: () => playReveal(section),
          onEnterBack: () => playReveal(section),
        });
      });

      // Stagger children inside reveal-stagger containers — replay every time in view
      const staggerContainers = scope.querySelectorAll('.lp-reveal-stagger');
      staggerContainers.forEach((container) => {
        const children = container.querySelectorAll(':scope > *');
        const playStagger = () => {
          gsap.killTweensOf(children);
          gsap.fromTo(
            children,
            { opacity: 0, y: 40, scale: 0.96 },
            { opacity: 1, y: 0, scale: 1, duration: 0.65, stagger: 0.08, ease: 'back.out(1.4)' }
          );
        };
        ScrollTrigger.create({
          trigger: container,
          start: 'top 82%',
          onEnter: playStagger,
          onEnterBack: playStagger,
        });
      });

      // Guarantee banner — replay scale-in every time in view
      const guarantee = scope.querySelector('.lp-guarantee');
      if (guarantee) {
        const playGuarantee = () => {
          gsap.killTweensOf(guarantee);
          gsap.fromTo(
            guarantee,
            { opacity: 0, scale: 0.98 },
            { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(1.2)' }
          );
        };
        ScrollTrigger.create({
          trigger: guarantee,
          start: 'top 88%',
          onEnter: playGuarantee,
          onEnterBack: playGuarantee,
        });
        // Guarantee shield: gentle float
        const shieldIcon = scope.querySelector('.guarantee-shield');
        if (shieldIcon) {
          gsap.to(shieldIcon, {
            y: -6,
            duration: 2.2,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            scrollTrigger: { trigger: guarantee, start: 'top 88%' },
          });
        }
      }

      // CTA button: subtle pulse to draw attention
      const ctaBtn = scope.querySelector('.cta-pulse-btn');
      if (ctaBtn) {
        gsap.to(ctaBtn, {
          scale: 1.03,
          duration: 1.8,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          scrollTrigger: { trigger: ctaBtn, start: 'top 90%' },
        });
      }

      // Materials section image: gentle float when in view
      const materialsImg = scope.querySelector('.materials-img-wrap');
      if (materialsImg) {
        ScrollTrigger.create({
          trigger: materialsImg,
          start: 'top 80%',
          onEnter: () => {
            gsap.to(materialsImg, {
              y: -10,
              duration: 2.5,
              ease: 'sine.inOut',
              repeat: -1,
              yoyo: true,
            });
          },
        });
      }

      // Hero parallax: background image moves slower on scroll
      const heroSection = scope.querySelector('.hero-section');
      const heroBg = scope.querySelector('.hero-bg-img');
      if (heroSection && heroBg) {
        gsap.to(heroBg, {
          y: 120,
          ease: 'none',
          scrollTrigger: {
            trigger: heroSection,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.2,
          },
        });
      }
    },
    { scope: scopeRef, dependencies: [] }
  );

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await client.auth.me();
      if (user?.data) {
        setIsLoggedIn(true);
      }
    } catch {
      setIsLoggedIn(false);
    }
  };

  const handleLogin = async () => {
    await client.auth.toLogin();
  };

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  const features = [
    {
      icon: Shield,
      title: 'Garantía de Entrega',
      description: 'CONSTRUCTODO actúa como garante de la entrega de tu obra. Tu inversión está protegida.',
    },
    {
      icon: Users,
      title: 'Profesionales Verificados',
      description: 'Todos nuestros profesionales pasan por un proceso de verificación riguroso.',
    },
    {
      icon: Star,
      title: 'Sistema de Reseñas',
      description: 'Califica y lee reseñas de otros clientes para tomar la mejor decisión.',
    },
    {
      icon: MessageSquare,
      title: 'Cotizaciones Competitivas',
      description: 'Recibe múltiples cotizaciones y elige la que mejor se adapte a tu presupuesto.',
    },
  ];

  const howItWorks = [
    {
      step: 1,
      title: 'Describe tu Proyecto',
      description: 'Completa el formulario con los detalles de tu obra, adjunta fotos y documentos.',
    },
    {
      step: 2,
      title: 'Recibe Cotizaciones',
      description: 'Los profesionales revisarán tu solicitud y enviarán sus propuestas.',
    },
    {
      step: 3,
      title: 'Elige al Mejor',
      description: 'Compara cotizaciones, revisa perfiles y selecciona al profesional ideal.',
    },
    {
      step: 4,
      title: 'Obra Garantizada',
      description: 'Tu proyecto está protegido por nuestra garantía de entrega.',
    },
  ];

  const services = [
    { name: 'Plomería', Icon: Wrench },
    { name: 'Electricidad', Icon: Zap },
    { name: 'Albañilería', Icon: Layers },
    { name: 'Pintura', Icon: Palette },
    { name: 'Carpintería', Icon: Hammer },
    { name: 'Techos', Icon: Home },
  ];

  return (
    <div ref={scopeRef} className="min-h-screen bg-slate-50/80 antialiased">
      {/* Header */}
      <header className="lp-header fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">CONSTRUCTODO</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#servicios" className="text-sm font-medium text-slate-600 hover:text-amber-600 transition-colors">
                Servicios
              </a>
              <a href="#como-funciona" className="text-sm font-medium text-slate-600 hover:text-amber-600 transition-colors">
                Cómo Funciona
              </a>
              <a href="#materiales" className="text-sm font-medium text-slate-600 hover:text-amber-600 transition-colors">
                Materiales
              </a>
            </nav>
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <Button
                  onClick={handleGoToDashboard}
                  className="bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg transition-all"
                >
                  Ir al Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
                    onClick={() => navigate('/login')}
                  >
                    Iniciar sesión
                  </Button>
                  <Button
                    onClick={() => navigate('/register')}
                    className="bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-lg transition-all font-medium"
                  >
                    Registrarse
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section pt-28 pb-20 lg:pt-36 lg:pb-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,158,11,0.15),transparent)]" />
        <div className="hero-bg-img absolute inset-0 opacity-15 will-change-transform">
          <img
            src="https://mgx-backend-cdn.metadl.com/generate/images/970111/2026-02-13/1b2b0a85-f705-4ba2-9c7d-e88b2c203d2b.png"
            alt="Construction team"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left">
              <Badge className="hero-badge bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3 py-1 text-xs font-medium tracking-wide mb-6">
                <Building2 className="w-3.5 h-3.5 mr-1.5 inline" />
                Plataforma de Construcción #1
              </Badge>
              <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
                Tu Proyecto de
                <span className="text-amber-400"> Construcción</span>
                <br />
                Garantizado
              </h1>
              <p className="hero-desc text-lg text-slate-300 mb-10 max-w-xl leading-relaxed">
                Conectamos clientes con los mejores profesionales de la construcción.
                Tu obra protegida con nuestra garantía de entrega.
              </p>
              <div className="hero-btns flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {isLoggedIn ? (
                  <Button
                    size="lg"
                    onClick={handleGoToDashboard}
                    className="bg-amber-500 hover:bg-amber-600 text-white text-base px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all font-medium"
                  >
                    Ir al Dashboard
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      onClick={handleLogin}
                      className="bg-amber-500 hover:bg-amber-600 text-white text-base px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all font-medium"
                    >
                      Soy Cliente
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={handleLogin}
                      className="border-2 border-white/50 text-white hover:bg-white/10 hover:border-white/80 text-base px-8 py-6 rounded-xl font-medium transition-all"
                    >
                      Soy Profesional
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="hidden lg:block hero-img">
              <div className="relative">
                <div className="hero-glow absolute -inset-4 bg-amber-500/10 rounded-3xl blur-2xl" />
                <img
                  src="https://mgx-backend-cdn.metadl.com/generate/images/970111/2026-02-13/c0b8ba04-c6a3-4ea2-953b-48bf726fa095.png"
                  alt="Client and professional handshake"
                  className="relative rounded-2xl shadow-2xl w-full ring-1 ring-white/10"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guarantee Banner */}
      <section className="py-10 bg-gradient-to-r from-amber-500 to-amber-600 shadow-lg">
        <div className="lp-guarantee max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-white">
            <div className="guarantee-shield w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-8 h-8" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold tracking-tight">Garantía CONSTRUCTODO</h3>
              <p className="text-amber-100/95 text-base mt-1">
                Tu inversión protegida, garantía legal y mediación profesional por tan solo el 4.5% de la cotización.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-20 lg:py-28">
        <div className="lp-reveal max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              Servicios Disponibles
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Encuentra profesionales especializados en todo tipo de trabajos de construcción
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg ring-1 ring-slate-200/50 bg-slate-200">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop"
                alt="Proyecto de construcción"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  const t = e.currentTarget;
                  t.onerror = null;
                  t.src = 'https://picsum.photos/600/400?random=1';
                }}
              />
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg ring-1 ring-slate-200/50">
              <img
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop"
                alt="Edificio y construcción profesional"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg ring-1 ring-slate-200/50 sm:block hidden">
              <img
                src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&auto=format&fit=crop"
                alt="Planos y herramientas de construcción"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="lp-reveal-stagger grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-5">
            {services.map((service) => (
              <Card
                key={service.name}
                className="group hover:shadow-xl hover:border-amber-200/80 transition-all duration-300 cursor-pointer border border-slate-200/80 rounded-2xl bg-white overflow-hidden"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                    <service.Icon className="w-7 h-7 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm lg:text-base">{service.name}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="lp-reveal max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              ¿Por qué CONSTRUCTODO?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              La plataforma más segura para gestionar tus proyectos de construcción
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-14 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-200/50">
                <img
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop"
                  alt="Profesional en obra de construcción"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-500 text-center lg:text-left">Profesionales en tu obra</p>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-200/50">
                <img
                  src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop"
                  alt="Obra de construcción en progreso"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-500 text-center lg:text-left">Tu proyecto, paso a paso</p>
            </div>
          </div>
          <div className="lp-reveal-stagger grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group border border-slate-200/80 rounded-2xl bg-white hover:shadow-xl hover:border-slate-200 transition-all duration-300"
              >
                <CardContent className="p-6 lg:p-7">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center mb-5 transition-colors">
                    <feature.icon className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900 mb-2 tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="como-funciona" className="py-20 lg:py-28 bg-slate-50/80">
        <div className="lp-reveal max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              ¿Cómo Funciona?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              En solo 4 pasos, tu proyecto de construcción estará en marcha
            </p>
          </div>
          <div className="lp-reveal-stagger grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {howItWorks.map((item) => (
              <div key={item.step} className="relative">
                <div className="bg-white rounded-2xl p-6 lg:p-7 shadow-sm border border-slate-200/80 h-full hover:shadow-lg transition-shadow">
                  <div className="w-11 h-11 rounded-xl bg-amber-500 text-white font-bold flex items-center justify-center mb-5 text-lg shadow-md">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg text-slate-900 mb-2 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
                </div>
                {item.step < 4 && (
                  <div className="hidden lg:block absolute top-8 -right-4 z-10">
                    <ArrowRight className="w-6 h-6 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Materials Section */}
      <section id="materiales" className="py-20 lg:py-28 bg-white">
        <div className="lp-reveal max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <div>
              <Badge className="bg-amber-50 text-amber-700 border border-amber-200/80 mb-5 px-3 py-1 text-xs font-medium">
                <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                Área de Materiales
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-5 tracking-tight">
                Materiales de las Mejores Marcas
              </h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                Trabajamos con las principales marcas del sector para garantizar
                la calidad de los materiales en tu proyecto.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  'Cemento y concreto de alta resistencia',
                  'Herramientas profesionales',
                  'Materiales eléctricos certificados',
                  'Tuberías y accesorios de plomería',
                  'Pinturas y acabados premium',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all font-medium px-8"
                onClick={() => navigate('/materials')}
              >
                Ver Catálogo de Materiales
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
            <div className="materials-img-wrap relative">
              <div className="absolute -inset-4 bg-amber-500/5 rounded-3xl blur-2xl" />
              <img
                src="https://mgx-backend-cdn.metadl.com/generate/images/970111/2026-02-13/d55812db-1775-45ec-9914-c3da4ec524d6.png"
                alt="Construction materials"
                className="relative rounded-2xl shadow-xl w-full ring-1 ring-slate-200/50"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="lp-reveal max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              Lo que dicen nuestros clientes
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Miles de proyectos realizados con la garantía CONSTRUCTODO
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: 'Encontré al profesional ideal para mi remodelación. La garantía me dio tranquilidad y el proceso fue muy claro.',
                name: 'María G.',
                role: 'Cliente, Bogotá',
                rating: 5,
              },
              {
                quote: 'Como profesional, CONSTRUCTODO me ha permitido conseguir proyectos serios y recibir mis pagos a tiempo. Muy recomendado.',
                name: 'Carlos R.',
                role: 'Profesional de obra',
                rating: 5,
              },
              {
                quote: 'Cotización justa, trato profesional y entrega a tiempo. Repetiré para el siguiente proyecto.',
                name: 'Andrea L.',
                role: 'Cliente, Medellín',
                rating: 5,
              },
            ].map((t, i) => (
              <Card key={i} className="border border-slate-200/80 rounded-2xl bg-slate-50/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 lg:p-7">
                  <Quote className="w-10 h-10 text-amber-500/60 mb-4" />
                  <p className="text-slate-700 mb-5 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="font-semibold text-slate-900">{t.name}</p>
                  <p className="text-sm text-slate-500">{t.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 opacity-25">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&auto=format&fit=crop"
            alt=""
            className="w-full h-full object-cover"
            aria-hidden
          />
        </div>
        <div className="lp-reveal relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
            ¿Listo para Comenzar tu Proyecto?
          </h2>
          <p className="text-lg text-slate-300 mb-10 leading-relaxed">
            Únete a miles de clientes satisfechos que han confiado en CONSTRUCTODO
          </p>
          {isLoggedIn ? (
            <Button
              size="lg"
              onClick={handleGoToDashboard}
              className="cta-pulse-btn bg-amber-500 hover:bg-amber-600 text-white text-base px-12 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all font-medium"
            >
              Ir al Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleLogin}
              className="cta-pulse-btn bg-amber-500 hover:bg-amber-600 text-white text-base px-12 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all font-medium"
            >
              Comenzar Ahora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </section>

      {/* Social proof / projects strip */}
      <section className="py-12 bg-slate-100/80 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-medium text-slate-500 uppercase tracking-wider mb-8">
            Proyectos realizados por profesionales CONSTRUCTODO
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-md">
              <img
                src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=500&auto=format&fit=crop"
                alt="Proyecto de renovación interior"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-md">
              <img
                src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=500&auto=format&fit=crop"
                alt="Casa terminada"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-md hidden sm:block">
              <img
                src="https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=500&auto=format&fit=crop"
                alt="Obra en progreso"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-md hidden md:block">
              <img
                src="https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=500&auto=format&fit=crop"
                alt="Detalle de construcción"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-14 bg-slate-900 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10 lg:gap-12">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">CONSTRUCTODO</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                La plataforma más segura para gestionar tus proyectos de construcción.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm tracking-wide uppercase">Para Clientes</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#como-funciona" className="hover:text-white transition-colors">Cómo Funciona</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Garantía</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Preguntas Frecuentes</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm tracking-wide uppercase">Para Profesionales</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Únete al Equipo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Beneficios</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Soporte</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-10 pt-8 text-center text-sm text-slate-500">
            <p>© 2026 CONSTRUCTODO. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp button */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#20BD5A] hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#25D366]/50"
        aria-label="Contactar por WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}