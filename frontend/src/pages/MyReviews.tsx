import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { ReviewCard } from '@/components/ReviewCard';
import { StarRating } from '@/components/ui/star-rating';
import { Star, ThumbsUp, MessageSquare } from 'lucide-react';
import { client, Review, UserProfile, formatDate } from '@/lib/api';
import { getAPIBaseURL } from '@/lib/config';
import { getStoredToken } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function MyReviews() {
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [receivedReviews, setReceivedReviews] = useState<Review[]>([]);
  const [givenReviews, setGivenReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState('received');
  const [platformRatingOpen, setPlatformRatingOpen] = useState(false);
  const [platformRating, setPlatformRating] = useState(0);
  const [platformFeedback, setPlatformFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = getStoredToken();
      const base = getAPIBaseURL();

      // Get profile
      const profileResponse = await client.entities.user_profiles.query({ limit: 1 });
      const profileData = profileResponse.data?.items?.[0];
      if (profileData) setProfile(profileData);

      // Received reviews: reviews about me (reviewed_id = me) – backend endpoint
      const receivedRes = await fetch(`${base}/api/v1/entities/reviews/by-reviewed`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (receivedRes.ok) {
        const receivedData = await receivedRes.json();
        setReceivedReviews(receivedData.items ?? []);
      } else {
        setReceivedReviews([]);
      }

      // Given reviews: reviews I wrote (user_id = me) – standard list
      const givenResponse = await client.entities.reviews.query({
        sort: '-created_at',
        limit: 50,
      });
      setGivenReviews(givenResponse.data?.items ?? []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('Error al cargar las reseñas');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authLogout();
    navigate('/', { replace: true });
  };

  const handleSubmitPlatformRating = async () => {
    try {
      setSubmittingRating(true);

      if (platformRating === 0) {
        toast.error('Por favor selecciona una calificación');
        return;
      }

      await client.entities.platform_ratings.create({
        data: {
          rating: platformRating,
          feedback: platformFeedback || null,
        },
      });

      toast.success('¡Gracias por tu calificación!');
      setPlatformRatingOpen(false);
      setPlatformRating(0);
      setPlatformFeedback('');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Error al enviar la calificación');
    } finally {
      setSubmittingRating(false);
    }
  };

  const userType = profile?.user_type || 'client';

  if (loading) {
    return (
      <DashboardLayout userType={userType} onLogout={handleLogout}>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const averageRating =
    profile?.average_rating != null && profile.total_reviews != null && profile.total_reviews > 0
      ? profile.average_rating
      : receivedReviews.length > 0
        ? receivedReviews.reduce((sum, r) => sum + r.rating, 0) / receivedReviews.length
        : 0;
  const totalReviewsCount =
    profile?.total_reviews != null ? profile.total_reviews : receivedReviews.length;

  return (
    <DashboardLayout userType={userType} onLogout={handleLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Mis Reseñas</h1>
            <p className="text-slate-500 mt-1">
              {userType === 'client'
                ? 'Revisa las calificaciones de los profesionales'
                : 'Revisa las calificaciones de tus clientes'}
            </p>
          </div>
          {userType === 'client' && (
            <Button
              onClick={() => setPlatformRatingOpen(true)}
              variant="outline"
              className="border-amber-500 text-amber-600 hover:bg-amber-50"
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Calificar Plataforma
            </Button>
          )}
        </div>

        {/* Stats Card */}
        <Card className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Tu Calificación Promedio</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-4xl font-bold">{averageRating.toFixed(1)}</span>
                  <StarRating rating={averageRating} readonly size="lg" />
                </div>
                <p className="text-amber-100 text-sm mt-2">
                  Basado en {totalReviewsCount} reseñas
                </p>
              </div>
              <Star className="w-16 h-16 text-amber-300 opacity-50" />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-100">
            <TabsTrigger value="received" className="data-[state=active]:bg-white">
              Recibidas ({receivedReviews.length})
            </TabsTrigger>
            <TabsTrigger value="given" className="data-[state=active]:bg-white">
              Dadas ({givenReviews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-6">
            {receivedReviews.length === 0 ? (
              <Card className="p-12 text-center">
                <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  No tienes reseñas aún
                </h3>
                <p className="text-slate-500">
                  Las reseñas aparecerán aquí cuando completes proyectos
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {receivedReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    reviewerName={review.reviewer_name || 'Usuario'}
                    rating={review.rating}
                    comment={review.comment}
                    date={review.created_at || new Date().toISOString()}
                    reviewerType={review.reviewer_type}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="given" className="mt-6">
            {givenReviews.length === 0 ? (
              <Card className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  No has dado reseñas aún
                </h3>
                <p className="text-slate-500">
                  Podrás calificar a {userType === 'client' ? 'profesionales' : 'clientes'} después de completar proyectos
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {givenReviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    reviewerName="Tú"
                    rating={review.rating}
                    comment={review.comment}
                    date={review.created_at || new Date().toISOString()}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Platform Rating Dialog */}
        <Dialog open={platformRatingOpen} onOpenChange={setPlatformRatingOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Califica tu Experiencia</DialogTitle>
              <DialogDescription>
                ¿Cómo ha sido tu experiencia usando CONSTRUCTODO?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex flex-col items-center gap-4">
                <StarRating
                  rating={platformRating}
                  onRatingChange={setPlatformRating}
                  size="lg"
                />
                <p className="text-sm text-slate-500">
                  {platformRating === 0
                    ? 'Selecciona una calificación'
                    : platformRating === 1
                    ? 'Muy malo'
                    : platformRating === 2
                    ? 'Malo'
                    : platformRating === 3
                    ? 'Regular'
                    : platformRating === 4
                    ? 'Bueno'
                    : 'Excelente'}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback">Comentarios (Opcional)</Label>
                <Textarea
                  id="feedback"
                  placeholder="Cuéntanos cómo podemos mejorar..."
                  rows={4}
                  value={platformFeedback}
                  onChange={(e) => setPlatformFeedback(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPlatformRatingOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitPlatformRating}
                disabled={submittingRating || platformRating === 0}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {submittingRating ? 'Enviando...' : 'Enviar Calificación'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}