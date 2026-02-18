import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Plus,
  FileText,
  MapPin,
  DollarSign,
  Calendar,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { client, ProjectRequest, PROJECT_STATUS, formatCurrency, formatDate } from '@/lib/api';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function MyProjects() {
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const { userType, loading: profileLoading } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (profileLoading) return;
    if (userType === 'professional') navigate('/dashboard', { replace: true });
  }, [userType, profileLoading, navigate]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await client.entities.project_requests.query({
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

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && project.status === activeTab;
  });

  const getStatusCounts = () => {
    return {
      all: projects.length,
      pending: projects.filter((p) => p.status === 'pending').length,
      in_progress: projects.filter((p) => p.status === 'in_progress').length,
      completed: projects.filter((p) => p.status === 'completed').length,
    };
  };

  const counts = getStatusCounts();

  if (profileLoading || userType === 'professional') {
    return (
      <DashboardLayout userType="client" onLogout={handleLogout}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40" />
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
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40" />
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Mis Proyectos</h1>
            <p className="text-slate-500 mt-1">Proyectos que publicaste y su estado (abiertos, en progreso, completados)</p>
          </div>
          <Button
            onClick={() => navigate('/projects/new')}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Publicar proyecto
          </Button>
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-100">
            <TabsTrigger value="all" className="data-[state=active]:bg-white">
              Todos ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-white">
              Abiertos ({counts.pending})
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="data-[state=active]:bg-white">
              En progreso ({counts.in_progress})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-white">
              Completados ({counts.completed})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredProjects.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  No hay proyectos
                </h3>
                <p className="text-slate-500 mb-6">
                  {activeTab === 'all'
                    ? 'Aún no has publicado ningún proyecto'
                    : `No tienes proyectos ${
                        activeTab === 'pending'
                          ? 'abiertos a ofertas'
                          : activeTab === 'in_progress'
                          ? 'en progreso'
                          : 'completados'
                      }`}
                </p>
                <Button
                  onClick={() => navigate('/projects/new')}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Publicar proyecto
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((project) => {
                  const status =
                    PROJECT_STATUS[project.status as keyof typeof PROJECT_STATUS] ||
                    PROJECT_STATUS.pending;

                  return (
                    <Card
                      key={project.id}
                      className="hover:shadow-lg transition-all duration-200 cursor-pointer"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg text-slate-800">
                                {project.title}
                              </h3>
                              <Badge className={status.color}>{status.label}</Badge>
                            </div>
                            <p className="text-slate-600 text-sm line-clamp-2 mb-4">
                              {project.description}
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                              {project.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {project.location}
                                </div>
                              )}
                              {project.estimated_budget && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  {formatCurrency(project.estimated_budget)}
                                </div>
                              )}
                              {project.created_at && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {formatDate(project.created_at)}
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
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-400 ml-4" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}