export type QualityStatus = 'Approved' | 'Under QC' | 'Inspected' | 'Rejected' | 'Shaded';

export type StockStatus = 'In Stock' | 'Partially Issued' | 'Exhausted';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  style: string;
  buyer: string;
  item: string;
  orderQty: number; // in KG
  unit: 'KG' | 'YARDS';
  season: string;
  supplier: string;
  orderDate: string; // YYYY-MM-DD
  deliveryDate: string; // YYYY-MM-DD
  status: 'Pending' | 'Receiving' | 'Completed' | 'Closed';
  remarks?: string;
  createdAt: string;
}

export interface FabricRoll {
  id: string;
  poId: string;
  poNumber: string;
  rollNo: string; // e.g. "R-001", "R-002" - unique per PO
  rollIndex: number; // sequential number for this PO (1, 2, 3...)
  receivingId: string;
  receiveDate: string;
  challanNo: string;
  supplier: string;
  buyer: string;
  style: string;
  item: string;
  color: string;
  fabricType: string;
  gsm: number;
  lotNo: string;
  originalWeight: number; // kg
  currentWeight: number; // kg remaining
  rackNo: string; // e.g. "Rack-A1-02"
  width: string; // e.g. "68 Inch"
  qualityStatus: QualityStatus;
  shadeGrade?: string; // A, B, C
  stockStatus: StockStatus;
  lastIssuedDate?: string;
  remarks?: string;
}

export interface FabricReceiveItemInput {
  color: string;
  fabricType: string;
  gsm: number;
  lotNo: string;
  weight: number;
  rackNo: string;
  width: string;
  qualityStatus: QualityStatus;
  shadeGrade?: string;
  remarks?: string;
}

export interface FabricReceiveRecord {
  id: string;
  receivingDate: string;
  challanNo: string;
  poId: string;
  poNumber: string;
  supplier: string;
  buyer: string;
  style: string;
  item: string;
  rolls: FabricRoll[];
  totalWeight: number;
  rollCount: number;
  receivedBy: string;
  remarks?: string;
  createdAt: string;
}

export interface IssueItemDetail {
  rollId: string;
  rollNo: string;
  lotNo: string;
  color: string;
  rackNo: string;
  previousWeight: number;
  issuedWeight: number;
  remainingWeight: number;
  isFullRoll: boolean;
}

export interface FabricIssueRecord {
  id: string;
  issueDate: string;
  issueSlipNo: string;
  poId: string;
  poNumber: string;
  buyer: string;
  style: string;
  item: string;
  issuedTo: string; // e.g., "Cutting Table #1", "Sampling Dept"
  issuedBy: string;
  purpose: string;
  items: IssueItemDetail[];
  totalIssuedWeight: number;
  rollsCount: number;
  remarks?: string;
  createdAt: string;
}

export interface WarehouseRack {
  id: string;
  name: string; // e.g., "Rack-A1"
  zone: string; // "Zone A - Knits"
  aisle: string;
  tier: string;
  capacityKg: number;
  maxRolls: number;
}

export type UserRole = 'master_admin' | 'store_in_charge' | 'operator' | 'cutting_floor';

export interface UserPermission {
  canManageUsers: boolean;
  canManagePOs: boolean;
  canReceiveFabric: boolean;
  canIssueFabric: boolean;
  canManageRacks: boolean;
  canViewReports: boolean;
  canViewSlowMoving: boolean;
  canDeleteRecords: boolean;
  canSystemReset: boolean;
}

export interface StoreUser {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  role: UserRole;
  department: string;
  avatarBg: string;
  status: 'Active' | 'Suspended';
  phone?: string;
  password?: string;
  permissions: UserPermission;
  lastLogin?: string;
  createdAt: string;
}

export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, UserPermission> = {
  master_admin: {
    canManageUsers: true,
    canManagePOs: true,
    canReceiveFabric: true,
    canIssueFabric: true,
    canManageRacks: true,
    canViewReports: true,
    canViewSlowMoving: true,
    canDeleteRecords: true,
    canSystemReset: true,
  },
  store_in_charge: {
    canManageUsers: false,
    canManagePOs: true,
    canReceiveFabric: true,
    canIssueFabric: true,
    canManageRacks: true,
    canViewReports: true,
    canViewSlowMoving: true,
    canDeleteRecords: false,
    canSystemReset: false,
  },
  operator: {
    canManageUsers: false,
    canManagePOs: false,
    canReceiveFabric: true,
    canIssueFabric: true,
    canManageRacks: false,
    canViewReports: true,
    canViewSlowMoving: false,
    canDeleteRecords: false,
    canSystemReset: false,
  },
  cutting_floor: {
    canManageUsers: false,
    canManagePOs: false,
    canReceiveFabric: false,
    canIssueFabric: false,
    canManageRacks: false,
    canViewReports: true,
    canViewSlowMoving: false,
    canDeleteRecords: false,
    canSystemReset: false,
  },
};

export const ROLE_LABELS: Record<UserRole, { label: string; description: string; badgeColor: string }> = {
  master_admin: {
    label: 'Master Admin',
    description: 'Full system ownership, security policy & user role assignment',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  store_in_charge: {
    label: 'Store In-Charge',
    description: 'Warehouse supervisor, receiving/issuance authorization & inventory controller',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  operator: {
    label: 'Store Operator',
    description: 'Roll receiving, scanning, barcoding & dispatch execution',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  cutting_floor: {
    label: 'Cutting Floor User',
    description: 'Requisition tracking, roll stock verification & inspection viewer',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
};
