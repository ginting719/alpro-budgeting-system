// Fix: Removed incorrect import causing a circular dependency. The User interface is defined in this file.

export type Role = 'USER' | 'MANAGER' | 'BOD' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  managerId?: string;
  bodId?: string;
  password?: string;
}

export interface CompanyProfile {
  profileId: string;
  companyName: string;
  companyAddress: string;
  npwp: string;
}

export interface DeliveryAddress {
  addressId: string;
  addressLabel: string;
  fullAddress: string;
}

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  unit: string;
  price: number;
  vendorId: string; // Added to link product to a vendor
}

export interface BudgetItem {
  productId: string;
  productName: string;
  productImage: string;
  unit: string;
  price: number;
  qty: number;
  total: number;
}

export enum BudgetStatus {
  DRAFT = 'DRAFT',
  PENDING_MANAGER_APPROVAL = 'Pending Manager Approval',
  PENDING_BOD_APPROVAL = 'Pending BOD Approval',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export enum ProcurementStatus {
  PENDING = 'Pending Procurement',
  IN_PROGRESS = 'In Progress',
  PROCURED = 'Procured',
}

export interface BudgetRequest {
  id: string;
  userId: string;
  userName: string;
  department: string;
  items: BudgetItem[];
  total: number;
  status: BudgetStatus;
  procurementStatus?: ProcurementStatus;
  submittedAt: string;
  managerApproverId?: string;
  bodApproverId?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  poGenerated?: boolean; // Added to track PO generation status
  // FIX: Add properties to store assigned company and address for procurement.
  // This resolves type errors where these properties were being used without being defined.
  assignedCompanyProfileId?: string;
  assignedDeliveryAddress?: string;
}

export interface Vendor {
    vendorId: string;
    vendorName: string;
    vendorAddress: string;
    vendorContact: string;
    termOfPayment: string;
}

export interface PurchaseOrder {
  poId: string;
  vendorId: string;
  vendorName: string;
  dateIssued: string;
  items: BudgetItem[];
  totalAmount: number;
  relatedBudgetIds: string[];
  companyProfileId: string;
  deliveryAddress: string;
}
