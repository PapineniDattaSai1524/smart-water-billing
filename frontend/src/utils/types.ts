// ==============================
// Shared API / domain types
// ==============================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface ApiErrorBody {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
  details?: string[];
}

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'RESIDENT';

export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  username: string;
  phoneNumber?: string;
  role: Role;
  enabled: boolean;
  createdAt: string;
}

export interface JwtResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  username: string;
  role: Role;
  expiresInMs: number;
}

export interface Apartment {
  id: number;
  name: string;
  addressLine: string;
  city: string;
  state: string;
  zipCode: string;
  totalUnits: number;
  adminId?: number;
  adminName?: string;
  householdCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Household {
  id: number;
  apartmentId: number;
  apartmentName: string;
  unitNumber: string;
  /** Globally unique (platform-wide) id the Building Owner shares with a resident so they
   *  can self-register and be linked to this exact household automatically. */
  householdCode: string;
  areaSqft: number;
  occupancyCount: number;
  hasMeter: boolean;
  meterConfigured: boolean;
  residentCount: number;
  /** Full name of the household's active primary resident, or null if nobody is assigned yet. */
  residentName: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RelationType = 'PRIMARY' | 'MEMBER';

export interface PendingResident {
  id: number;
  fullName: string;
  username: string;
  email: string;
  phoneNumber?: string | null;
  registeredAt: string;
  status: string;
}

export interface AssignableResident {
  id: number;
  fullName: string;
  email: string;
  username: string;
}

export interface ResidentAssignment {
  id: number;
  householdId: number;
  unitNumber: string;
  userId: number;
  userFullName: string;
  userEmail: string;
  relationType: RelationType;
  moveInDate: string;
  moveOutDate?: string | null;
  active: boolean;
}

export type MeterType = 'ANALOG' | 'DIGITAL' | 'SMART_IOT';
export type MeterStatus = 'ACTIVE' | 'INACTIVE' | 'FAULTY' | 'REPLACED';

export interface WaterMeterConfig {
  id: number;
  householdId: number;
  unitNumber: string;
  meterNumber: string;
  meterType: MeterType;
  installationDate: string;
  initialReading: number;
  status: MeterStatus;
}

export type UsageSource = 'MANUAL' | 'CSV_UPLOAD';

export interface WaterUsageLog {
  id: number;
  householdId: number;
  unitNumber: string;
  readingDate: string;
  meterReadingKl: number;
  consumptionKl: number;
  source: UsageSource;
  recordedByName?: string;
  remarks?: string;
}

export interface CsvUploadResult {
  totalRows: number;
  successCount: number;
  duplicateCount: number;
  errorCount: number;
  errors: string[];
}

// ==============================
// Multi-tenant SaaS platform types
// ==============================

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RegistrationRequest {
  id: number;
  communityName: string;
  apartmentName: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  adminFullName: string;
  adminEmail: string;
  adminPhoneNumber: string;
  status: RegistrationStatus;
  rejectionReason?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedByName?: string | null;
  createdCommunityId?: number | null;
  createdApartmentId?: number | null;
  createdAdminUserId?: number | null;
  createdAdminUsername?: string | null;
}

export interface SuperAdminDashboardStats {
  pendingRequests: number;
  approvedCommunities: number;
  rejectedRequests: number;
  totalCommunities: number;
  totalAdministrators: number;
  totalResidents: number;
  totalWaterUsageRecords: number;
}

// ==============================
// Phase 2: User Management
// ==============================

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface Resident {
  id: number;
  residentCode: string | null;
  profilePhotoUrl: string | null;
  fullName: string;
  email: string;
  phoneNumber: string;
  gender: Gender | null;
  dateOfBirth: string | null;
  emergencyContact: string | null;
  occupation: string | null;
  familyMembers: number | null;
  apartmentId: number | null;
  apartmentName: string | null;
  householdId: number | null;
  unitNumber: string | null;
  enabled: boolean;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface AdminDashboardStats {
  totalApartments: number;
  totalHouseholds: number;
  totalResidents: number;
  activeMeters: number;
  currentMonthConsumptionKl: number;
  previousMonthConsumptionKl: number;
  unreadNotifications: number;
}

export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;

  /** Alert & Notification Engine context - undefined/null for pre-existing event-driven notification types. */
  severity?: NotificationSeverity | null;
  householdId?: number | null;
  householdUnitNumber?: string | null;
  apartmentId?: number | null;
  apartmentName?: string | null;
  relatedUsageLogId?: number | null;
  billingMonth?: string | null;
}

export type OwnerNotificationStatus = 'SENT' | 'PENDING' | 'FAILED';

/** One "send" action in a Building Owner's Notification History (fans out to many residents, shown as one row). */
export interface OwnerNotificationBatch {
  batchId: string;
  title: string;
  message: string;
  audience: string;
  sentAt: string;
  sentByName: string | null;
  status: OwnerNotificationStatus;
  recipientCount: number;
}


export interface NotificationSearchParams {
  type?: string;
  read?: boolean;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export interface AlertThresholdConfig {
  apartmentId: number;
  apartmentName: string;
  dailyThresholdKl: number | null;
  anomalyStdDevMultiplier: number | null;
  minHistoryReadings: number | null;
  enabled: boolean;
  effectiveDailyThresholdKl: number;
  effectiveAnomalyStdDevMultiplier: number;
  effectiveMinHistoryReadings: number;
}

export interface AlertThresholdConfigPayload {
  dailyThresholdKl?: number | null;
  anomalyStdDevMultiplier?: number | null;
  minHistoryReadings?: number | null;
  enabled?: boolean | null;
}

// ==============================
// Phase 3: Enterprise Administration
// ==============================

export interface CommunityRow {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  active: boolean;
  apartmentName: string | null;
  adminName: string | null;
  adminEmail: string | null;
  totalHouseholds: number;
  totalResidents: number;
  createdAt: string;
}

export interface AuditLogEntry {
  id: number;
  actorName: string | null;
  action: string;
  entityType: string | null;
  entityId: number | null;
  details: string | null;
  createdAt: string;
}

export interface ResidentDashboardStats {
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED' | 'UNASSIGNED';
  message?: string | null;
  apartmentName: string | null;
  unitNumber: string | null;
  currentMonthUsageKl: number | null;
  previousMonthUsageKl: number | null;
  averageUsageKl: number | null;
  latestReadingKl: number | null;
  latestReadingDate: string | null;
  unreadNotifications: number;
}

// ==============================
// Week 5-6: dashboard trend charts & benchmarking
// ==============================

export interface UsageTrendPoint {
  label: string;
  consumptionKl: number;
}

export type ComparisonStatus = 'BELOW_AVERAGE' | 'NEAR_AVERAGE' | 'ABOVE_AVERAGE';

export interface ConsumptionComparison {
  billingMonth: string;
  myUsageKl: number;
  apartmentAverageKl: number | null;
  similarSizedAverageKl: number | null;
  apartmentHouseholdCount: number;
  similarSizedHouseholdCount: number;
  status: ComparisonStatus;
  possibleLeak: boolean;
}

// ==============================
// Phase 4: Billing
// ==============================

export type InvoiceStatus = 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface TariffTier {
  id?: number;
  tierOrder?: number;
  minKl: number;
  maxKl: number | null;
  ratePerKl: number;
}

export interface TariffPlan {
  id: number;
  apartmentId: number;
  apartmentName: string;
  name: string;
  ratePerKl: number;
  fixedCharge: number;
  taxPercentage?: number;
  minimumCharge?: number | null;
  maximumCharge?: number | null;
  tiered?: boolean;
  tiers?: TariffTier[];
  active: boolean;
}

export interface BillingBreakdown {
  consumptionKl: number;
  baseCharge: number;
  fixedCharge: number;
  sharedCharge: number;
  subtotal: number;
  taxPercentage: number;
  taxAmount: number;
}

export interface Invoice {
  id: number;
  householdId: number;
  unitNumber: string;
  apartmentName: string;
  residentName: string | null;
  billingMonth: string;
  consumptionKl: number;
  ratePerKl: number;
  fixedCharge: number;
  baseCharge: number;
  taxAmount: number;
  totalAmount: number;
  breakdown: BillingBreakdown | null;
  status: InvoiceStatus;
  dueDate: string;
  paidAt: string | null;
  generatedAt: string;
}

export interface RevenueSummary {
  totalCollected: number;
  totalOutstanding: number;
}

// ==============================
// Week 5-6 Feature 2C: Billing Cycle Management
// ==============================

export type CycleStatus = 'OPEN' | 'CLOSED' | 'FINALIZED' | 'ARCHIVED';

export interface BillingCycle {
  id: number;
  apartmentId: number;
  apartmentName: string;
  billingMonth: string;
  status: CycleStatus;
  openedByAdminName: string | null;
  openedAt: string | null;
  closedAt: string | null;
  finalizedAt: string | null;
  archivedAt: string | null;
  reopenedAt: string | null;
  recalculationCount: number;
  invoiceCount: number;
  notes: string | null;
}

export interface CyclePaymentStatus {
  cycleId: number;
  billingMonth: string;
  totalInvoices: number;
  paidCount: number;
  unpaidCount: number;
  overdueCount: number;
  cancelledCount: number;
  totalBilled: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionRatePercent: number;
}

// ==============================
// Week 5-6 Feature 2E: Bulk Water Purchase Entry
// ==============================

export type WaterSourceType = 'TANKER' | 'MUNICIPAL';

export interface WaterPurchase {
  id: number;
  apartmentId: number;
  apartmentName: string;
  sourceType: WaterSourceType;
  vendorName: string;
  quantityKl: number;
  cost: number;
  costPerKl: number;
  purchaseDate: string;
  invoiceReference: string | null;
  notes: string | null;
  distributed: boolean;
  distributedAt: string | null;
  createdAt: string;
}

export interface PurchaseSummary {
  totalQuantityKl: number;
  totalCost: number;
  averageCostPerKl: number;
  purchaseCount: number;
}

// ---------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------
export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'NETBANKING';

export interface PaymentRecord {
  id: number;
  invoiceId: number;
  unitNumber: string;
  apartmentName: string;
  billingMonth: string;
  amount: number;
  method: PaymentMethod;
  transactionRef: string | null;
  paidByName: string | null;
  collectedByName: string | null;
  paidAt: string;
}

// ---------------------------------------------------------------------
// Analytics / Reports
// ---------------------------------------------------------------------
export interface MonthlyValue {
  month: string;
  value: number;
}

export interface RevenueAnalytics {
  totalCollected: number;
  totalOutstanding: number;
  monthlyRevenue: MonthlyValue[];
}

export interface TopConsumer {
  unitNumber: string;
  consumptionKl: number;
}

export interface WaterAnalytics {
  /** All-time consumption across every recorded reading -- a lifetime total, not a "current" figure. */
  totalConsumptionKl: number;
  /** Consumption for the current calendar month only. */
  currentMonthConsumptionKl: number;
  /** Consumption for the calendar month immediately before the current one. */
  previousMonthConsumptionKl: number;
  /** Up to the last 6 calendar months that actually have logged readings -- never zero-filled. */
  monthlyConsumption: MonthlyValue[];
  /** Ranked leaderboard (highest first, capped) -- only households with a current-month reading. */
  topConsumers: TopConsumer[];
  /** EVERY household in the admin's apartment(s), unit-number ordered, zero-filled. Use this for the Household Usage Comparison chart. */
  householdUsage: TopConsumer[];
}

export interface PlatformAnalytics {
  totalCommunities: number;
  totalApartments: number;
  totalHouseholds: number;
  totalAdministrators: number;
  totalResidents: number;
  totalRevenueCollected: number;
  totalOutstanding: number;
  totalWaterConsumptionKl: number;
}

export interface SystemHealth {
  status: string;
  databaseUp: boolean;
  appVersion: string;
  uptimeSeconds: number;
  totalUsers: number;
  totalCommunities: number;
  totalApartments: number;
  totalHouseholds: number;
}

export interface PlatformUser {
  id: number;
  fullName: string;
  email: string;
  username: string;
  role: Role;
  enabled: boolean;
  createdAt: string | null;
}
