import type { Certification, CertificationApplication, Coupon } from "@/lib/types";

export const mockCertifications: Certification[] = [
  {
    id: "cert-1",
    userId: "user-1",
    status: "eligible",
    appliedAt: undefined,
    reviewedAt: undefined,
    approvedAt: undefined,
    rejectedAt: undefined,
    rejectionReason: undefined,
    certificateUrl: undefined,
    certificateNumber: undefined,
  },
];

export const mockCertificationApplications: CertificationApplication[] = [
  {
    id: "app-1",
    userId: "user-3",
    userName: "Ivana Babić",
    userEmail: "ivana.babic@example.com",
    appliedAt: new Date("2024-03-15"),
    status: "under_review",
    level1CompletedAt: new Date("2024-02-28"),
    level2CompletedAt: new Date("2024-03-10"),
  },
  {
    id: "app-2",
    userId: "user-4",
    userName: "Petra Novak",
    userEmail: "petra.novak@example.com",
    appliedAt: new Date("2024-03-18"),
    status: "applied",
    level1CompletedAt: new Date("2024-03-01"),
    level2CompletedAt: new Date("2024-03-15"),
  },
];

export const mockCoupons: Coupon[] = [
  {
    id: "coupon-1",
    code: "WELCOME20",
    discountType: "percentage",
    discountValue: 20,
    usageLimit: 100,
    usageCount: 45,
    expiresAt: new Date("2024-06-30"),
    isActive: true,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "coupon-2",
    code: "BRANDIA50",
    discountType: "fixed",
    discountValue: 50,
    usageLimit: 50,
    usageCount: 12,
    expiresAt: new Date("2024-04-30"),
    isActive: true,
    createdAt: new Date("2024-02-15"),
  },
  {
    id: "coupon-3",
    code: "EARLYBIRD",
    discountType: "percentage",
    discountValue: 30,
    usageLimit: 20,
    usageCount: 20,
    expiresAt: new Date("2024-01-31"),
    isActive: false,
    createdAt: new Date("2023-12-01"),
  },
];

export function getCertificationForUser(userId: string): Certification | undefined {
  return mockCertifications.find((c) => c.userId === userId);
}

export function getPendingApplications(): CertificationApplication[] {
  return mockCertificationApplications.filter(
    (app) => app.status === "applied" || app.status === "under_review"
  );
}

export function getActiveCoupons(): Coupon[] {
  return mockCoupons.filter((c) => c.isActive);
}
