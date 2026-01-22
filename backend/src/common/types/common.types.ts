
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}


export type UserRole = 'STUDENT' | 'SHOP' | 'ADMIN';

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PRINTING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export type SortDirection = 'asc' | 'desc';

export interface IdParams {
  id: string;
}

export interface ShopAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface PrintConfig {
  pages: string;
  color: boolean;
  copies: number;
  binding: string;
  sides: 'single' | 'double';
}

export interface FileMetadata {
  url: string;
  name: string;
  pages: number;
  size?: number;
}
