import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Users,
  UserCircle,
  FileText,
  MessageSquare,
  Star,
  Settings,
  Shield,
  HardDrive,
  RefreshCw,
  UserCheck,
  Briefcase,
  BarChart3,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, type AdminStats, type AdminPageViewsResponse } from '@/api/admin';
import { toast } from 'sonner';

const platformChartConfig: ChartConfig = {
  usuarios: { label: 'Usuarios', color: 'hsl(38 92% 50%)' },
  perfiles: { label: 'Perfiles', color: 'hsl(217 91% 60%)' },
  clientes: { label: 'Clientes', color: 'hsl(160 84% 39%)' },
  profesionales: { label: 'Profesionales', color: 'hsl(199 89% 48%)' },
  solicitudes: { label: 'Solicitudes', color: 'hsl(160 84% 37%)' },
  cotizaciones: { label: 'Cotizaciones', color: 'hsl(263 70% 50%)' },
  reseñas: { label: 'Reseñas', color: 'hsl(347 77% 50%)' },
};

const userTypeChartConfig: ChartConfig = {
  clientes: { label: 'Clientes', color: 'hsl(160 84% 39%)' },
  profesionales: { label: 'Profesionales', color: 'hsl(199 89% 48%)' },
};

const pageViewsChartConfig: ChartConfig = {
  visitas: { label: 'Visitas', color: 'hsl(217 91% 60%)' },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageViews, setPageViews] = useState<AdminPageViewsResponse | null>(null);
  const [metricsDays, setMetricsDays] = useState(30);

  const loadStats = async () => {
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch {
      toast.error('Error al cargar estadísticas');
    }
  };

  const loadPageViews = async () => {
    try {
      const data = await adminApi.getPageViews(metricsDays);
      setPageViews(data);
    } catch {
      toast.error('Error al cargar métricas de visitas');
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await loadStats();
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    loadPageViews();
  }, [metricsDays]);

  const handleLogout = async () => {
    await authLogout();
    navigate('/', { replace: true });
  };

  if (loading) {
    return (
      <DashboardLayout userType="client" onLogout={handleLogout} isAdmin>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userType="client" onLogout={handleLogout} isAdmin>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 flex items-center gap-2">
              <Shield className="w-8 h-8 text-amber-600" />
              Panel de Super Admin
            </h1>
            <p className="text-slate-500 mt-1">
              Gestión completa de la plataforma CONSTRUCTODO
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { loadStats(); loadPageViews(); }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/settings">
                <Settings className="w-4 h-4 mr-2" />
                Configuración
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Métricas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-7 gap-4">
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Usuarios</p>
                  <p className="text-2xl font-bold text-slate-800">{stats?.users ?? 0}</p>
                </div>
                <Users className="w-10 h-10 text-amber-500/80" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Perfiles</p>
                  <p className="text-2xl font-bold text-slate-800">{stats?.profiles ?? 0}</p>
                </div>
                <UserCircle className="w-10 h-10 text-blue-500/80" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Clientes</p>
                  <p className="text-2xl font-bold text-slate-800">{stats?.clients ?? 0}</p>
                </div>
                <UserCheck className="w-10 h-10 text-emerald-600/80" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-sky-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Profesionales</p>
                  <p className="text-2xl font-bold text-slate-800">{stats?.professionals ?? 0}</p>
                </div>
                <Briefcase className="w-10 h-10 text-sky-600/80" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Solicitudes</p>
                  <p className="text-2xl font-bold text-slate-800">{stats?.project_requests ?? 0}</p>
                </div>
                <FileText className="w-10 h-10 text-emerald-500/80" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-violet-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Cotizaciones</p>
                  <p className="text-2xl font-bold text-slate-800">{stats?.quotes ?? 0}</p>
                </div>
                <MessageSquare className="w-10 h-10 text-violet-500/80" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-rose-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Reseñas</p>
                  <p className="text-2xl font-bold text-slate-800">{stats?.reviews ?? 0}</p>
                </div>
                <Star className="w-10 h-10 text-rose-500/80" />
              </div>
            </CardContent>
          </Card>
        </div>

            {/* Platform overview charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumen de la plataforma</CardTitle>
                  <CardDescription>
                    Comparación de usuarios, perfiles, clientes, profesionales y actividad.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={platformChartConfig} className="h-[280px] w-full">
                    <BarChart
                      data={[
                        { name: 'usuarios', value: stats?.users ?? 0, fill: 'var(--color-usuarios)' },
                        { name: 'perfiles', value: stats?.profiles ?? 0, fill: 'var(--color-perfiles)' },
                        { name: 'clientes', value: stats?.clients ?? 0, fill: 'var(--color-clientes)' },
                        { name: 'profesionales', value: stats?.professionals ?? 0, fill: 'var(--color-profesionales)' },
                        { name: 'solicitudes', value: stats?.project_requests ?? 0, fill: 'var(--color-solicitudes)' },
                        { name: 'cotizaciones', value: stats?.quotes ?? 0, fill: 'var(--color-cotizaciones)' },
                        { name: 'reseñas', value: stats?.reviews ?? 0, fill: 'var(--color-reseñas)' },
                      ]}
                      margin={{ bottom: 20, left: 12, right: 12 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tickFormatter={(v) => platformChartConfig[v]?.label ?? v} />
                      <YAxis allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {[
                          { name: 'usuarios', fill: 'var(--color-usuarios)' },
                          { name: 'perfiles', fill: 'var(--color-perfiles)' },
                          { name: 'clientes', fill: 'var(--color-clientes)' },
                          { name: 'profesionales', fill: 'var(--color-profesionales)' },
                          { name: 'solicitudes', fill: 'var(--color-solicitudes)' },
                          { name: 'cotizaciones', fill: 'var(--color-cotizaciones)' },
                          { name: 'reseñas', fill: 'var(--color-reseñas)' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tipos de usuario</CardTitle>
                  <CardDescription>
                    Clientes vs profesionales con perfil completado.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {((stats?.clients ?? 0) + (stats?.professionals ?? 0)) === 0 ? (
                    <p className="text-center text-sm text-slate-500 py-8">Aún no hay perfiles de cliente o profesional.</p>
                  ) : (
                    <ChartContainer config={userTypeChartConfig} className="h-[280px] w-full">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie
                          data={[
                            { name: 'clientes', value: stats?.clients ?? 0, fill: 'var(--color-clientes)' },
                            { name: 'profesionales', value: stats?.professionals ?? 0, fill: 'var(--color-profesionales)' },
                          ].filter((d) => d.value > 0)}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          label={({ name, value }) => `${userTypeChartConfig[name]?.label ?? name}: ${value}`}
                        >
                          {[
                            { name: 'clientes', value: stats?.clients ?? 0, fill: 'var(--color-clientes)' },
                            { name: 'profesionales', value: stats?.professionals ?? 0, fill: 'var(--color-profesionales)' },
                          ]
                            .filter((d) => d.value > 0)
                            .map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Legend />
                      </PieChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick links - only in Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="w-5 h-5" />
                    Configuración de plataforma
                  </CardTitle>
                  <CardDescription>
                    Variables de entorno backend/frontend (admin settings).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline">
                    <Link to="/settings">Ir a Configuración</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <HardDrive className="w-5 h-5" />
                    Almacenamiento
                  </CardTitle>
                  <CardDescription>
                    Crear buckets y gestionar almacenamiento (API disponible).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500">
                    Usa la API de storage desde el backend para crear buckets cuando integres OSS/S3.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Métricas de visitas
                </CardTitle>
                <CardDescription>
                  Visitas por página del sitio (últimos días). Total: {pageViews?.total ?? 0} visitas.
                </CardDescription>
                <div className="flex gap-2 mt-2">
                  <Select value={String(metricsDays)} onValueChange={(v) => setMetricsDays(Number(v))}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Últimos 7 días</SelectItem>
                      <SelectItem value="30">Últimos 30 días</SelectItem>
                      <SelectItem value="90">Últimos 90 días</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" onClick={loadPageViews}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {pageViews?.by_path && pageViews.by_path.length > 0 ? (
                  <>
                    <ChartContainer config={pageViewsChartConfig} className="h-[300px] w-full">
                      <BarChart
                        data={pageViews.by_path.map((row) => ({
                          path: row.path || '/',
                          visitas: row.count,
                          fill: 'var(--color-visitas)',
                        }))}
                        margin={{ bottom: 20, left: 12, right: 12 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="path"
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) => (v.length > 20 ? v.slice(0, 18) + '…' : v)}
                        />
                        <YAxis allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="visitas" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                    <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Página</TableHead>
                          <TableHead className="text-right">Visitas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pageViews.by_path.map((row) => (
                          <TableRow key={row.path}>
                            <TableCell className="font-mono text-sm">{row.path || '/'}</TableCell>
                            <TableCell className="text-right font-medium">{row.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  </>
                ) : (
                  <p className="text-slate-500 text-sm">Aún no hay datos de visitas. Las visitas se registran al navegar por el sitio.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
