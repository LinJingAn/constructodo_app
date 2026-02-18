import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Building2, User, Briefcase, ArrowRight, ArrowLeft, Shield } from 'lucide-react';
import { client, CONSTRUCTION_SERVICES } from '@/lib/api';
import { toast } from 'sonner';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<'client' | 'professional'>('client');
  const userTypeRef = useRef<'client' | 'professional'>('client');
  useEffect(() => {
    userTypeRef.current = userType;
  }, [userType]);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    whatsapp: '',
    id_number: '',
    bio: '',
    services: [] as string[],
  });

  const handleServiceToggle = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((s) => s !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (!formData.full_name || !formData.email) {
        toast.error('Por favor completa los campos requeridos');
        return;
      }

      if (userType === 'professional' && formData.services.length === 0) {
        toast.error('Por favor selecciona al menos un servicio');
        return;
      }

      const selectedType = userTypeRef.current || userType;
      await client.entities.user_profiles.create({
        data: {
          user_type: selectedType,
          userType: selectedType,
          full_name: formData.full_name,
          email: formData.email,
          whatsapp: formData.whatsapp || null,
          id_number: formData.id_number || null,
          bio: formData.bio || null,
          services: selectedType === 'professional' ? JSON.stringify(formData.services) : null,
          is_verified: false,
          average_rating: 0,
          total_reviews: 0,
        },
      });

      toast.success('¡Perfil creado exitosamente!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Error al crear el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Configura tu Perfil</CardTitle>
          <CardDescription>
            {step === 1
              ? 'Selecciona el tipo de cuenta que deseas crear'
              : step === 2
              ? 'Completa tu información personal'
              : 'Selecciona los servicios que ofreces'}
          </CardDescription>
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-colors ${
                  s <= step ? 'bg-amber-500' : 'bg-slate-200'
                } ${userType === 'client' && s === 3 ? 'hidden' : ''}`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Step 1: Select User Type */}
          {step === 1 && (
            <div className="space-y-6">
              <RadioGroup
                value={userType}
                onValueChange={(value) => {
                  const v = value as 'client' | 'professional';
                  userTypeRef.current = v;
                  setUserType(v);
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="client"
                  className={`flex flex-col items-center gap-4 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    userType === 'client'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <RadioGroupItem value="client" id="client" className="sr-only" />
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      userType === 'client' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <User className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">Soy Cliente</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Busco profesionales para mi proyecto de construcción
                    </p>
                  </div>
                </Label>
                <Label
                  htmlFor="professional"
                  className={`flex flex-col items-center gap-4 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    userType === 'professional'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <RadioGroupItem value="professional" id="professional" className="sr-only" />
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      userType === 'professional'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Briefcase className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-lg">Soy Profesional</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Ofrezco servicios de construcción
                    </p>
                  </div>
                </Label>
              </RadioGroup>

              {/* Info about commission */}
              <div
                className={`p-4 rounded-lg ${
                  userType === 'client' ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Shield className={`w-5 h-5 mt-0.5 ${userType === 'client' ? 'text-amber-600' : 'text-slate-600'}`} />
                  <div className="text-sm">
                    {userType === 'client' ? (
                      <>
                        <p className="font-medium text-amber-800">Garantía CONSTRUCTODO</p>
                        <p className="text-amber-700 mt-1">
                          Se aplica una comisión del 4.5% sobre la cotización. CONSTRUCTODO actúa como garante de la entrega de la obra. Cualquier negociación directa con el profesional anula la garantía.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-slate-800">Información de Comisión</p>
                        <p className="text-slate-600 mt-1">
                          Se cobra un 10% sobre el pago recibido. Está prohibido negociar fuera de la plataforma.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-amber-500 hover:bg-amber-600"
                onClick={() => setStep(2)}
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Personal Information */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nombres y Apellidos *</Label>
                  <Input
                    id="full_name"
                    placeholder="Juan Pérez"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="juan@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    placeholder="+57 300 123 4567"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id_number">Número de Identificación</Label>
                  <Input
                    id="id_number"
                    placeholder="1234567890"
                    value={formData.id_number}
                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Perfil (Opcional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Cuéntanos un poco sobre ti..."
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Atrás
                </Button>
                {userType === 'professional' ? (
                  <Button
                    className="flex-1 bg-amber-500 hover:bg-amber-600"
                    onClick={() => setStep(3)}
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    className="flex-1 bg-amber-500 hover:bg-amber-600"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Creando...' : 'Crear Perfil'}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Services (Professional only) */}
          {step === 3 && userType === 'professional' && (
            <div className="space-y-6">
              <p className="text-sm text-slate-600">
                Selecciona los servicios que ofreces (puedes seleccionar varios):
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 min-w-0">
                {CONSTRUCTION_SERVICES.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceToggle(service.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all min-w-0 ${
                      formData.services.includes(service.id)
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Checkbox
                      checked={formData.services.includes(service.id)}
                      onCheckedChange={() => handleServiceToggle(service.id)}
                      className="shrink-0"
                    />
                    <service.icon className="h-6 w-6 text-slate-600 shrink-0" />
                    <span className="text-sm font-medium min-w-0 break-words line-clamp-2">{service.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Atrás
                </Button>
                <Button
                  className="flex-1 bg-amber-500 hover:bg-amber-600"
                  onClick={handleSubmit}
                  disabled={loading || formData.services.length === 0}
                >
                  {loading ? 'Creando...' : 'Crear Perfil'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}