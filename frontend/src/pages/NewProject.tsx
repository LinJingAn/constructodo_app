import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Upload,
  DollarSign,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Check,
  Image,
  File,
  X,
} from 'lucide-react';
import { client, UserProfile } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function NewProject() {
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_all_inclusive: false,
    client_provides_materials: false,
    estimated_budget: '',
    location: '',
  });
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile?.user_type === 'professional') navigate('/dashboard', { replace: true });
  }, [profile?.user_type, navigate]);

  const loadProfile = async () => {
    try {
      const response = await client.entities.user_profiles.query({ limit: 1 });
      if (response.data?.items?.length > 0) {
        setProfile(response.data.items[0]);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (!formData.title || !formData.description) {
        toast.error('Por favor completa los campos requeridos');
        return;
      }

      // Create project request
      const projectResponse = await client.entities.project_requests.create({
        data: {
          title: formData.title,
          description: formData.description,
          is_all_inclusive: formData.is_all_inclusive,
          client_provides_materials: formData.client_provides_materials,
          estimated_budget: formData.estimated_budget ? parseFloat(formData.estimated_budget) : null,
          location: formData.location || null,
          status: 'pending',
        },
      });

      toast.success('¡Proyecto publicado! Los profesionales podrán enviar ofertas.');
      navigate('/my-projects');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Error al publicar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authLogout();
    navigate('/', { replace: true });
  };

  const progress = (step / 3) * 100;
  const userType = profile?.user_type || 'client';

  if (userType === 'professional') {
    return (
      <DashboardLayout userType="professional" onLogout={handleLogout}>
        <div className="space-y-6">
          <p className="text-slate-500">Redirigiendo...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType={userType} onLogout={handleLogout}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Publicar proyecto</h1>
          <p className="text-slate-500 mt-1">Describe tu proyecto para recibir cotizaciones</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-slate-500 mb-2">
            <span>Paso {step} de 3</span>
            <span>{Math.round(progress)}% completado</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardContent className="p-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Información del Proyecto</h2>
                    <p className="text-sm text-slate-500">Describe qué necesitas</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título del Proyecto *</Label>
                    <Input
                      id="title"
                      placeholder="Ej: Remodelación de baño"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción Detallada *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe tu proyecto con el mayor detalle posible..."
                      rows={6}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    <p className="text-xs text-slate-500">
                      Incluye medidas, materiales preferidos, y cualquier detalle importante
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Ubicación</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="location"
                        className="pl-10"
                        placeholder="Ciudad, Barrio"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!formData.title || !formData.description}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Detalles y Presupuesto</h2>
                    <p className="text-sm text-slate-500">Especifica tus preferencias</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Presupuesto Estimado (COP)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="budget"
                        type="number"
                        className="pl-10"
                        placeholder="5000000"
                        value={formData.estimated_budget}
                        onChange={(e) => setFormData({ ...formData, estimated_budget: e.target.value })}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Los profesionales podrán enviar ofertas basadas en tu presupuesto
                    </p>
                  </div>

                  <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="all_inclusive" className="font-medium">
                          ¿A todo costo?
                        </Label>
                        <p className="text-sm text-slate-500">
                          El profesional incluye materiales y mano de obra
                        </p>
                      </div>
                      <Switch
                        id="all_inclusive"
                        checked={formData.is_all_inclusive}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_all_inclusive: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="materials" className="font-medium">
                          ¿Usted pone los materiales?
                        </Label>
                        <p className="text-sm text-slate-500">
                          Usted proporciona los materiales necesarios
                        </p>
                      </div>
                      <Switch
                        id="materials"
                        checked={formData.client_provides_materials}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, client_provides_materials: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Atrás
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="flex-1 bg-amber-500 hover:bg-amber-600"
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Files & Submit */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">Archivos Adjuntos</h2>
                    <p className="text-sm text-slate-500">Adjunta planos, imágenes o instrucciones</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div
                    className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-amber-400 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('file-input')?.click()}
                  >
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">
                      Haz clic para subir archivos
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      Fotos, videos, documentos o PDF (máx. 10MB cada uno)
                    </p>
                    <input
                      id="file-input"
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {getFileIcon(file)}
                            <span className="text-sm font-medium truncate max-w-xs">
                              {file.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <h3 className="font-semibold text-amber-800 mb-3">Resumen del proyecto</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-amber-700">Título:</span>
                      <span className="font-medium text-amber-900">{formData.title}</span>
                    </div>
                    {formData.location && (
                      <div className="flex justify-between">
                        <span className="text-amber-700">Ubicación:</span>
                        <span className="font-medium text-amber-900">{formData.location}</span>
                      </div>
                    )}
                    {formData.estimated_budget && (
                      <div className="flex justify-between">
                        <span className="text-amber-700">Presupuesto:</span>
                        <span className="font-medium text-amber-900">
                          ${parseInt(formData.estimated_budget).toLocaleString()} COP
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-amber-700">A todo costo:</span>
                      <span className="font-medium text-amber-900">
                        {formData.is_all_inclusive ? 'Sí' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700">Cliente provee materiales:</span>
                      <span className="font-medium text-amber-900">
                        {formData.client_provides_materials ? 'Sí' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Atrás
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-amber-500 hover:bg-amber-600"
                  >
                    {loading ? (
                      'Enviando...'
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Publicar proyecto
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}