import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, DollarSign, FileText, MessageSquare } from 'lucide-react';
import { ProjectRequest, PROJECT_STATUS, formatCurrency, formatDate } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: ProjectRequest;
  userType: 'client' | 'professional';
  onViewDetails?: () => void;
  onSubmitQuote?: () => void;
}

export function ProjectCard({
  project,
  userType,
  onViewDetails,
  onSubmitQuote,
}: ProjectCardProps) {
  const status = PROJECT_STATUS[project.status as keyof typeof PROJECT_STATUS] || PROJECT_STATUS.pending;

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-slate-800 line-clamp-1">
              {project.title}
            </h3>
            {project.client_name && userType === 'professional' && (
              <p className="text-sm text-slate-500 mt-1">
                Cliente: {project.client_name}
              </p>
            )}
          </div>
          <Badge className={cn(status.color, "ml-2")}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-slate-600 line-clamp-2 mb-4">
          {project.description}
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {project.location && (
            <div className="flex items-center gap-2 text-slate-500">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{project.location}</span>
            </div>
          )}
          {project.estimated_budget && (
            <div className="flex items-center gap-2 text-slate-500">
              <DollarSign className="w-4 h-4" />
              <span>{formatCurrency(project.estimated_budget)}</span>
            </div>
          )}
          {project.created_at && (
            <div className="flex items-center gap-2 text-slate-500">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(project.created_at)}</span>
            </div>
          )}
          {project.quotes_count !== undefined && (
            <div className="flex items-center gap-2 text-slate-500">
              <MessageSquare className="w-4 h-4" />
              <span>{project.quotes_count} cotizaciones</span>
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
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onViewDetails}
          >
            <FileText className="w-4 h-4 mr-2" />
            Ver Detalles
          </Button>
          {userType === 'professional' && project.status === 'pending' && (
            <Button
              className="flex-1 bg-amber-500 hover:bg-amber-600"
              onClick={onSubmitQuote}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Cotizar
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}