
export { authMiddleware, optionalAuthMiddleware, requireRole } from './middleware/index.js';

export {
  roleGuard,
  studentOnly,
  shopOnly,
  adminOnly,
  shopOrAdmin,
  shopOwnerGuard,
  orderAccessGuard,
  isShopOwnerGuard,
} from './guards/index.js';

export {
  decorateRequest,
  getUser,
  getUserId,
  isAuthenticated,
  hasRole,
  isAdmin,
  isShopOwner,
  isStudent,
  sendSuccess,
  sendError,
  sendPaginated,
} from './decorators/index.js';

export type {
  ApiResponse,
  PaginatedResponse,
  Pagination,
  PaginationQuery,
  UserRole,
  OrderStatus,
  PaymentStatus,
  SortDirection,
  IdParams,
  ShopAddress,
  GeoLocation,
  PrintConfig,
  FileMetadata,
  RequestUser,
  AuthenticatedRequest,
  OptionalAuthRequest,
  RequestWithId,
  RequestWithShopId,
  RequestWithOrderId,
  PaginatedRequest,
} from './types/index.js';
