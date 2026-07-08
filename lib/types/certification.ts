export type CertificationStatus =
  | "not_eligible"
  | "eligible"
  | "applied"
  | "under_review"
  | "approved"
  | "rejected";

export interface Certification {
  id: string;
  userId: string;
  status: CertificationStatus;
  appliedAt?: Date;
  reviewedAt?: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  certificateUrl?: string;
  certificateNumber?: string;
}

export interface CertificationApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  appliedAt: Date;
  status: CertificationStatus;
  level1CompletedAt: Date;
  level2CompletedAt: Date;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  usageLimit?: number;
  usageCount: number;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
}
