import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Clock, DollarSign, Check, X } from 'lucide-react';
import { Quote, QUOTE_STATUS, formatCurrency, formatDate } from '@/lib/api';
import { DEFAULT_AVATAR_URL } from '@/lib/config';
import { cn } from '@/lib/utils';

interface QuoteCardProps {
  quote: Quote;
  userType: 'client' | 'professional';
  professionalImage?: string;
  onAccept?: () => void;
  onReject?: () => void;
  onViewProject?: () => void;
}

export function QuoteCard({
  quote,
  userType,
  professionalImage,
  onAccept,
  onReject,
  onViewProject,
}: QuoteCardProps) {
  const status = QUOTE_STATUS[quote.status as keyof typeof QUOTE_STATUS] || QUOTE_STATUS.pending;
  const initials = quote.professional_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'PR';

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {userType === 'client' && (
              <Avatar className="w-10 h-10">
                <AvatarImage src={professionalImage || DEFAULT_AVATAR_URL} />
                <AvatarFallback className="bg-slate-200 text-slate-600">
                  {initials}
                </AvatarFallback>
              </Avatar>
            )}
            <div>
              {quote.professional_name && userType === 'client' && (
                <h3 className="font-semibold text-slate-800">
                  {quote.professional_name}
                </h3>
              )}
              <p className="text-sm text-slate-500">
                Cotización #{quote.id}
              </p>
            </div>
          </div>
          <Badge className={cn(status.color)}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Monto propuesto</span>
            <span className="text-2xl font-bold text-slate-800">
              {formatCurrency(quote.amount)}
            </span>
          </div>
        </div>
        {quote.description && (
          <p className="text-sm text-slate-600 mb-4 line-clamp-3">
            {quote.description}
          </p>
        )}
        <div className="flex gap-4 text-sm">
          {quote.estimated_days && (
            <div className="flex items-center gap-2 text-slate-500">
              <Clock className="w-4 h-4" />
              <span>{quote.estimated_days} días estimados</span>
            </div>
          )}
          {quote.created_at && (
            <div className="flex items-center gap-2 text-slate-500">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(quote.created_at)}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-3 border-t">
        <div className="flex gap-2 w-full">
          {userType === 'client' && quote.status === 'pending' && (
            <>
              <Button
                variant="outline"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                onClick={onReject}
              >
                <X className="w-4 h-4 mr-2" />
                Rechazar
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={onAccept}
              >
                <Check className="w-4 h-4 mr-2" />
                Aceptar
              </Button>
            </>
          )}
          {userType === 'professional' && (
            <Button
              variant="outline"
              className="w-full"
              onClick={onViewProject}
            >
              Ver Proyecto
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}