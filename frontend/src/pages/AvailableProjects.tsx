import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  FileText,
  MapPin,
  DollarSign,
  Calendar,
  MessageSquare,
  Clock,
  User,
} from 'lucide-react';
import { client, ProjectRequest, formatCurrency, formatDate } from '@/lib/api';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function AvailableProjects() {
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const { userType, loading: profileLoading } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<ProjectRequest | null>(null);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [quoteData, setQuoteData] = useState({
    amount: '',
    description: '',
    estimated_days: '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (profileLoading) return;
    if (userType === 'client') navigate('/dashboard', { replace: true });
  }, [userType, profileLoading, navigate]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      // Get all pending projects (public data)
      const response = await client.entities.project_requests.queryAll({
        query: { status: 'pending' },
        sort: '-created_at',
        limit: 50,
      });
      
      if (response.data?.items) {
        setProjects(response.data.items);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Error al cargar los proyectos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authLogout();
    navigate('/', { replace: true });
  };

  const handleOpenQuoteDialog = (project: ProjectRequest) => {
    setSelectedProject(project);
    setQuoteData({ amount: '', description: '', estimated_days: '' });
    setQuoteDialogOpen(true);
  };

  const handleSubmitQuote = async () => {
    if (!selectedProject) return;

    try {
      setSubmittingQuote(true);

      if (!quoteData.amount) {
        toast.error('Por favor ingresa el monto de la cotización');
        return;
      }

      await client.entities.quotes.create({
        data: {
          project_id: selectedProject.id,
          amount: parseFloat(quoteData.amount),
          description: quoteData.description || null,
          estimated_days: quoteData.estimated_days ? parseInt(quoteData.estimated_days) : null,
          status: 'pending',
        },
      });

      toast.success('¡Oferta enviada! El cliente la revisará.');
      setQuoteDialogOpen(false);
      loadProjects();
    } catch (error) {
      console.error('Error submitting quote:', error);
      toast.error('Error al enviar la cotización');
    } finally {
      setSubmittingQuote(false);
    }
  };

  const filteredProjects = projects.filter(
    (project) =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (profileLoading || userType === 'client') {
    return (
      <DashboardLayout userType="professional" onLogout={handleLogout}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout userType={userType} onLogout={handleLogout}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType={userType} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
            Proyectos Disponibles
          </h1>
            <p className="text-slate-500 mt-1">
            Proyectos abiertos a ofertas. Envía tu oferta para que el cliente te contrate.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar proyectos..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              No hay proyectos disponibles
            </h3>
            <p className="text-slate-500">
              No hay proyectos abiertos a ofertas en este momento. Vuelve más tarde.
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-all duration-200 flex flex-col"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg text-slate-800 line-clamp-1">
                      {project.title}
                    </h3>
                    <Badge className="bg-yellow-100 text-yellow-800 ml-2">
                      Pendiente
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3 flex-1">
                  <p className="text-sm text-slate-600 line-clamp-3 mb-4">
                    {project.description}
                  </p>
                  <div className="space-y-2 text-sm">
                    {project.location && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{project.location}</span>
                      </div>
                    )}
                    {project.estimated_budget && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium text-slate-700">
                          {formatCurrency(project.estimated_budget)}
                        </span>
                      </div>
                    )}
                    {project.created_at && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(project.created_at)}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    {project.is_all_inclusive && (
                      <Badge variant="outline" className="text-xs">
                        A todo costo
                      </Badge>
                    )}
                    {project.client_provides_materials && (
                      <Badge variant="outline" className="text-xs">
                        Cliente provee materiales
                      </Badge>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-3 border-t">
                  <Button
                    className="w-full bg-amber-500 hover:bg-amber-600"
                    onClick={() => handleOpenQuoteDialog(project)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Hacer oferta
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Quote Dialog */}
        <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Enviar oferta</DialogTitle>
              <DialogDescription>
                {selectedProject?.title}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedProject?.estimated_budget && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Presupuesto del cliente:</p>
                  <p className="text-lg font-semibold text-slate-800">
                    {formatCurrency(selectedProject.estimated_budget)}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="quote_amount">Monto de tu oferta (COP) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="quote_amount"
                    type="number"
                    className="pl-10"
                    placeholder="5000000"
                    value={quoteData.amount}
                    onChange={(e) =>
                      setQuoteData({ ...quoteData, amount: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quote_days">Días Estimados</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="quote_days"
                    type="number"
                    className="pl-10"
                    placeholder="15"
                    value={quoteData.estimated_days}
                    onChange={(e) =>
                      setQuoteData({ ...quoteData, estimated_days: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quote_description">Descripción de tu oferta</Label>
                <Textarea
                  id="quote_description"
                  placeholder="Describe qué incluye tu oferta, materiales, garantías, etc."
                  rows={4}
                  value={quoteData.description}
                  onChange={(e) =>
                    setQuoteData({ ...quoteData, description: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setQuoteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitQuote}
                disabled={submittingQuote || !quoteData.amount}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {submittingQuote ? 'Enviando...' : 'Enviar oferta'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}