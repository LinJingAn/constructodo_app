import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  MessageSquare,
  Star,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { client, UserProfile, ProjectRequest, formatCurrency } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    pendingProjects: 0,
    completedProjects: 0,
    totalQuotes: 0,
    averageRating: 0,
  });
  const [recentProjects, setRecentProjects] = useState<ProjectRequest[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get user profile
      const profileResponse = await client.entities.user_profiles.query({
        limit: 1,
      });
      
      if (profileResponse.data?.items?.length > 0) {
        setProfile(profileResponse.data.items[0]);
        
        const userType = profileResponse.data.items[0].user_type;
        
        // Load projects based on user type
        if (userType === 'client') {
          const projectsResponse = await client.entities.project_requests.query({
            sort: '-created_at',
            limit: 5,
          });
          
          if (projectsResponse.data?.items) {
            setRecentProjects(projectsResponse.data.items);
            const projects = projectsResponse.data.items;
            setStats({
              totalProjects: projects.length,
              pendingProjects: projects.filter((p: ProjectRequest) => p.status === 'pending').length,
              completedProjects: projects.filter((p: ProjectRequest) => p.status === 'completed').length,
              totalQuotes: 0,
              averageRating: profileResponse.data.items[0].average_rating || 0,
            });
          }
        } else {
          // Professional - load quotes
          const quotesResponse = await client.entities.quotes.query({
            sort: '-created_at',
            limit: 10,
          });
          
          if (quotesResponse.data?.items) {
            setStats({
              totalProjects: 0,
              pendingProjects: 0,
              completedProjects: 0,
              totalQuotes: quotesResponse.data.items.length,
              averageRating: profileResponse.data.items[0].average_rating || 0,
            });
          }
        }
      } else {
        // No profile, redirect to profile setup
        navigate('/profile-setup');
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authLogout();
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <DashboardLayout userType="client" onLogout={handleLogout}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const userType = profile?.user_type || 'client';

  return (
    <DashboardLayout userType={userType} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
              ¡Bienvenido, {profile?.full_name?.split(' ')[0] || 'Usuario'}!
            </h1>
            <p className="text-slate-500 mt-1">
              {userType === 'client'
                ? 'Publica proyectos y contrata profesionales'
                : 'Encuentra proyectos y envía ofertas'}
            </p>
          </div>
          {userType === 'client' && (
            <Button
              onClick={() => navigate('/projects/new')}
              className="bg-amber-500 hover:bg-amber-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Solicitud
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {userType === 'client' ? (
            <>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Total Proyectos</p>
                      <p className="text-3xl font-bold text-slate-800">{stats.totalProjects}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Pendientes</p>
                      <p className="text-3xl font-bold text-slate-800">{stats.pendingProjects}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Completados</p>
                      <p className="text-3xl font-bold text-slate-800">{stats.completedProjects}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Calificación</p>
                      <p className="text-3xl font-bold text-slate-800">
                        {stats.averageRating.toFixed(1)}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Star className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Ofertas enviadas</p>
                      <p className="text-3xl font-bold text-slate-800">{stats.totalQuotes}</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Proyectos Activos</p>
                      <p className="text-3xl font-bold text-slate-800">0</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Calificación</p>
                      <p className="text-3xl font-bold text-slate-800">
                        {stats.averageRating.toFixed(1)}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Star className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Comisión</p>
                      <p className="text-3xl font-bold text-slate-800">10%</p>
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Info Banner for Professionals */}
        {userType === 'professional' && (
          <Card className="bg-gradient-to-r from-slate-800 to-slate-900 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Información Importante</h3>
                  <p className="text-slate-300 text-sm">
                    Recuerda que se cobra un <span className="text-amber-400 font-semibold">10%</span> sobre el pago recibido.
                    Está estrictamente prohibido negociar fuera de la plataforma CONSTRUCTODO.
                    El incumplimiento puede resultar en la suspensión de tu cuenta.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Banner for Clients */}
        {userType === 'client' && (
          <Card className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <img
                  src="https://mgx-backend-cdn.metadl.com/generate/images/970111/2026-02-13/cc7f0330-a4a7-4b78-942a-8dcb18c7c660.png"
                  alt="Guarantee"
                  className="w-12 h-12 flex-shrink-0"
                />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Tu Garantía CONSTRUCTODO</h3>
                  <p className="text-amber-100 text-sm">
                    CONSTRUCTODO actúa como garante de la entrega de tu obra. Se aplica una comisión del{' '}
                    <span className="font-semibold text-white">4.5%</span> sobre la oferta contratada.
                    Cualquier negociación directa con el profesional fuera de la plataforma anulará la garantía.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Projects (Client) */}
        {userType === 'client' && recentProjects.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Proyectos Recientes</CardTitle>
              <Button variant="ghost" onClick={() => navigate('/my-projects')}>
                Ver todos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.slice(0, 3).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-800">{project.title}</h4>
                        <p className="text-sm text-slate-500">
                          {project.estimated_budget
                            ? formatCurrency(project.estimated_budget)
                            : 'Sin presupuesto'}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={
                        project.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : project.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }
                    >
                      {project.status === 'pending'
                        ? 'Pendiente'
                        : project.status === 'completed'
                        ? 'Completado'
                        : 'En Progreso'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userType === 'client' ? (
            <>
              <Card
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                onClick={() => navigate('/projects/new')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Publicar proyecto</h3>
                    <p className="text-sm text-slate-500">Publica un proyecto y recibe ofertas</p>
                  </div>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                onClick={() => navigate('/my-projects')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Mis Proyectos</h3>
                    <p className="text-sm text-slate-500">Ver todos tus proyectos</p>
                  </div>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                onClick={() => navigate('/materials')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Materiales</h3>
                    <p className="text-sm text-slate-500">Explora nuestro catálogo</p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                onClick={() => navigate('/available-projects')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Proyectos disponibles</h3>
                    <p className="text-sm text-slate-500">Encuentra nuevos trabajos</p>
                  </div>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                onClick={() => navigate('/my-quotes')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Mis ofertas</h3>
                    <p className="text-sm text-slate-500">Gestiona tus ofertas</p>
                  </div>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                onClick={() => navigate('/profile')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Star className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Mi Perfil</h3>
                    <p className="text-sm text-slate-500">Actualiza tu información</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}