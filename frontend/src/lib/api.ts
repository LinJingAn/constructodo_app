import { createClient } from '@metagptx/web-sdk';
import type { LucideIcon } from 'lucide-react';
import {
  Wrench,
  Zap,
  Layers,
  Palette,
  Hammer,
  Home,
  Box,
  Snowflake,
  TreePine,
  Building2,
} from 'lucide-react';
import { getAPIBaseURL } from './config';

// Create client instance for backend API (baseURL so requests hit backend, not frontend origin)
export const client = createClient({ baseURL: getAPIBaseURL() });

// Service types for professionals (icons from Lucide React)
export const CONSTRUCTION_SERVICES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'plumbing', label: 'Plomería', icon: Wrench },
  { id: 'electrical', label: 'Electricidad', icon: Zap },
  { id: 'masonry', label: 'Albañilería', icon: Layers },
  { id: 'painting', label: 'Pintura', icon: Palette },
  { id: 'carpentry', label: 'Carpintería', icon: Hammer },
  { id: 'roofing', label: 'Techos', icon: Home },
  { id: 'flooring', label: 'Pisos', icon: Box },
  { id: 'hvac', label: 'Aire Acondicionado', icon: Snowflake },
  { id: 'landscaping', label: 'Jardinería', icon: TreePine },
  { id: 'general', label: 'Construcción General', icon: Building2 },
];

// Project status options (Freelancer-style workflow)
export const PROJECT_STATUS = {
  pending: { label: 'Abierto a ofertas', color: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'En progreso', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completado', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

// Payment/escrow status (Freelancer-style: pay → held in escrow → release to freelancer)
export const PAYMENT_STATUS = {
  pending_payment: { label: 'Pago pendiente', color: 'bg-amber-100 text-amber-800' },
  paid: { label: 'En garantía', color: 'bg-blue-100 text-blue-800' },
  released: { label: 'Liberado', color: 'bg-green-100 text-green-800' },
};

// Commission per CONSTRUCTODO requirements: client 4.5% on quote (garantía), professional 10% on payment received
export const CLIENT_COMMISSION_PERCENT = 4.5;
export const PROFESSIONAL_COMMISSION_PERCENT = 10;

// Quote/bid status options (Freelancer-style: bid submitted → hired / declined)
export const QUOTE_STATUS = {
  pending: { label: 'Enviada', color: 'bg-yellow-100 text-yellow-800' },
  accepted: { label: 'Contratada', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-800' },
};

// Types
export interface UserProfile {
  id: number;
  user_id: string;
  user_type: 'client' | 'professional';
  full_name: string;
  email: string;
  whatsapp?: string;
  id_number?: string;
  bio?: string;
  services?: string;
  profile_image?: string;
  is_verified?: boolean;
  average_rating?: number;
  total_reviews?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectRequest {
  id: number;
  user_id: string;
  title: string;
  description: string;
  is_all_inclusive?: boolean;
  client_provides_materials?: boolean;
  estimated_budget?: number;
  location?: string;
  status: string;
  selected_quote_id?: number;
  payment_status?: string; // 'pending_payment' | 'paid' | 'released'
  total_client_paid?: number;
  paid_at?: string;
  created_at?: string;
  updated_at?: string;
  client_name?: string;
  quotes_count?: number;
}

export interface Quote {
  id: number;
  user_id: string;
  project_id: number;
  amount: number;
  description?: string;
  estimated_days?: number;
  status: string;
  created_at?: string;
  updated_at?: string;
  professional_name?: string;
}

export interface Review {
  id: number;
  user_id: string;
  reviewer_id: string;
  reviewed_id: string;
  project_id?: number;
  rating: number;
  comment?: string;
  reviewer_type: 'client' | 'professional';
  created_at?: string;
  reviewer_name?: string;
}

export interface PlatformRating {
  id: number;
  user_id: string;
  rating: number;
  feedback?: string;
  created_at?: string;
}

export interface ProjectTransaction {
  id: number;
  project_id: number;
  transaction_type: 'quote_accepted' | 'payment_deposited' | 'payment_released' | 'project_completed';
  amount: number | null;
  created_at: string;
  project_title?: string;
}

export const TRANSACTION_TYPE_LABELS: Record<ProjectTransaction['transaction_type'], string> = {
  quote_accepted: 'Oferta aceptada',
  payment_deposited: 'Pago depositado en garantía',
  payment_released: 'Pago liberado al profesional',
  project_completed: 'Proyecto completado',
};

export interface BalanceResponse {
  balance: number;
  updated_at: string | null;
}

export interface WithdrawalMethod {
  id: number;
  type: string;
  label: string;
  bank_name?: string;
  account_last4?: string;
  routing_or_swift?: string;
  identifier?: string;
  is_default: boolean;
  created_at: string;
}

export interface BillingMethod {
  id: number;
  type: string;
  label: string;
  last4?: string;
  card_brand?: string;
  email?: string;
  is_default: boolean;
  created_at: string;
}

export const BILLING_TYPE_LABELS: Record<string, string> = {
  card: 'Tarjeta',
  paypal: 'PayPal',
  payoneer: 'Payoneer',
};

export const WITHDRAWAL_TYPE_LABELS: Record<string, string> = {
  bank_account: 'Cuenta bancaria',
  paypal: 'PayPal',
  payoneer: 'Payoneer',
};

export interface Withdrawal {
  id: number;
  amount: number;
  withdrawal_method_id: number;
  method_label?: string;
  bank_name?: string;
  account_last4?: string;
  status: string;
  created_at: string;
  processed_at?: string | null;
}

export interface BalanceTransaction {
  id: number;
  amount: number;
  type: string;
  reference_type?: string;
  reference_id?: number;
  created_at: string;
}

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};