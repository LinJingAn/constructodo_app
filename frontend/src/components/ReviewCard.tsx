import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StarRating } from '@/components/ui/star-rating';
import { formatDate } from '@/lib/api';
import { DEFAULT_AVATAR_URL } from '@/lib/config';

interface ReviewCardProps {
  reviewerName: string;
  reviewerImage?: string;
  rating: number;
  comment?: string;
  date: string;
  reviewerType?: 'client' | 'professional';
}

export function ReviewCard({
  reviewerName,
  reviewerImage,
  rating,
  comment,
  date,
  reviewerType,
}: ReviewCardProps) {
  const initials = reviewerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={reviewerImage || DEFAULT_AVATAR_URL} alt={reviewerName} />
            <AvatarFallback className="bg-slate-200 text-slate-600">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h4 className="font-semibold text-slate-800">{reviewerName}</h4>
                {reviewerType && (
                  <span className="text-xs text-slate-500">
                    {reviewerType === 'client' ? 'Cliente' : 'Profesional'}
                  </span>
                )}
              </div>
              <span className="text-sm text-slate-500">{formatDate(date)}</span>
            </div>
            <StarRating rating={rating} readonly size="sm" />
            {comment && (
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {comment}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}