import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  ArrowLeft,
  CheckCircle,
  Truck,
  Shield,
  MapPin,
  Layers,
  Zap,
  Wrench,
  Palette,
  Home,
  Hammer,
} from 'lucide-react';

export default function Materials() {
  const navigate = useNavigate();

  const brands = [
    { name: 'Cemex', category: 'Cemento y Concreto' },
    { name: 'Argos', category: 'Cemento y Concreto' },
    { name: 'Corona', category: 'Acabados y Pisos' },
    { name: 'Pintuco', category: 'Pinturas' },
    { name: 'Pavco', category: 'Tuberías' },
    { name: 'Schneider', category: 'Eléctricos' },
    { name: 'Legrand', category: 'Eléctricos' },
    { name: 'DeWalt', category: 'Herramientas' },
  ];

  const categories = [
    {
      name: 'Cemento y Concreto',
      Icon: Layers,
      description: 'Cemento de alta resistencia, concreto premezclado',
    },
    {
      name: 'Materiales Eléctricos',
      Icon: Zap,
      description: 'Cables, interruptores, tableros certificados',
    },
    {
      name: 'Plomería',
      Icon: Wrench,
      description: 'Tuberías PVC, accesorios, grifería',
    },
    {
      name: 'Pinturas y Acabados',
      Icon: Palette,
      description: 'Pinturas premium, esmaltes, selladores',
    },
    {
      name: 'Pisos y Cerámicas',
      Icon: Home,
      description: 'Cerámicas, porcelanatos, pisos laminados',
    },
    {
      name: 'Herramientas',
      Icon: Hammer,
      description: 'Herramientas profesionales y accesorios',
    },
  ];

  const benefits = [
    {
      icon: Shield,
      title: 'Garantía de Calidad',
      description: 'Todos nuestros materiales cuentan con certificación de calidad',
    },
    {
      icon: Truck,
      title: 'Entrega a Domicilio',
      description: 'Llevamos los materiales directamente a tu obra',
    },
    {
      icon: CheckCircle,
      title: 'Mejores Precios',
      description: 'Precios competitivos gracias a nuestras alianzas',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">CONSTRUCTODO</span>
            </div>
            <div className="w-24" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800" />
        <div className="absolute inset-0 opacity-30">
          <img
            src="https://mgx-backend-cdn.metadl.com/generate/images/970111/2026-02-13/d55812db-1775-45ec-9914-c3da4ec524d6.png"
            alt="Materials"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-6">
            🏗️ Área de Materiales
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Materiales de las
            <span className="text-amber-400"> Mejores Marcas</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            Trabajamos con las principales marcas del sector para garantizar
            la calidad de los materiales en tu proyecto de construcción.
          </p>
          <Button
            size="lg"
            className="bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => navigate('/projects/new')}
          >
            Solicitar Cotización de Materiales
          </Button>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-slate-800">{benefit.title}</h3>
                  <p className="text-slate-600 mt-1">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-4">
              Categorías de Materiales
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Encuentra todo lo que necesitas para tu proyecto
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <Card
                key={category.name}
                className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <div className="w-14 h-14 mb-4 rounded-xl bg-amber-100 flex items-center justify-center">
                    <category.Icon className="w-7 h-7 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-lg text-slate-800 mb-2">
                    {category.name}
                  </h3>
                  <p className="text-slate-600 text-sm">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-4">
              Nuestras Marcas Aliadas
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Trabajamos con las marcas más reconocidas del sector
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {brands.map((brand) => (
              <Card key={brand.name} className="text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-slate-600">
                      {brand.name[0]}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-800">{brand.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{brand.category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-amber-500 to-amber-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            ¿Necesitas Materiales para tu Proyecto?
          </h2>
          <p className="text-lg text-amber-100 mb-8">
            Contáctanos y te ayudaremos a conseguir los mejores materiales al mejor precio
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-amber-600 hover:bg-amber-50"
              onClick={() => navigate('/projects/new')}
            >
              Solicitar Cotización
            </Button>
          </div>
        </div>
      </section>

      {/* Ubicación */}
      <section className="py-12 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <MapPin className="w-8 h-8 text-amber-400 mb-3" />
            <h4 className="font-semibold mb-1">Ubicación</h4>
            <p className="text-slate-400">Bogotá, Colombia</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 bg-slate-950 text-center text-slate-500 text-sm">
        <p>© 2026 CONSTRUCTODO. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}