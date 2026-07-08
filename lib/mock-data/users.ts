import type { User, Device, Purchase } from "@/lib/types";

export const mockUsers: User[] = [
  {
    id: "user-1",
    email: "ana.kovacevic@example.com",
    fullName: "Ana Kovačević",
    phone: "+385 91 234 5678",
    purchaseDate: new Date("2024-01-15"),
    purchasePackage: "advanced",
    subscriptionStatus: "active",
    currentLevel: 2,
    role: "user",
    createdAt: new Date("2024-01-15"),
    lastLoginAt: new Date("2024-03-20"),
  },
  {
    id: "user-2",
    email: "marija.horvat@example.com",
    fullName: "Marija Horvat",
    phone: "+385 98 765 4321",
    purchaseDate: new Date("2024-02-01"),
    purchasePackage: "basic",
    subscriptionStatus: "active",
    currentLevel: 1,
    role: "user",
    createdAt: new Date("2024-02-01"),
    lastLoginAt: new Date("2024-03-19"),
  },
  {
    id: "user-3",
    email: "ivana.babic@example.com",
    fullName: "Ivana Babić",
    phone: "+385 95 111 2233",
    purchaseDate: new Date("2024-02-15"),
    purchasePackage: "advanced",
    subscriptionStatus: "active",
    currentLevel: 2,
    role: "user",
    createdAt: new Date("2024-02-15"),
    lastLoginAt: new Date("2024-03-18"),
  },
  {
    id: "admin-1",
    email: "admin@brendiapro.hr",
    fullName: "Brendia Pro® Admin",
    purchaseDate: new Date("2023-01-01"),
    purchasePackage: "advanced",
    subscriptionStatus: "active",
    currentLevel: 3,
    role: "admin",
    createdAt: new Date("2023-01-01"),
    lastLoginAt: new Date("2024-03-20"),
  },
];

export const mockCurrentUser: User = mockUsers[0];

export const mockDevices: Device[] = [
  {
    id: "device-1",
    name: "MacBook Pro",
    browser: "Chrome 122",
    lastActive: new Date(),
    isCurrent: true,
  },
  {
    id: "device-2",
    name: "iPhone 15",
    browser: "Safari Mobile",
    lastActive: new Date("2024-03-18"),
    isCurrent: false,
  },
];

export const mockPurchases: Purchase[] = [
  {
    id: "purchase-1",
    date: new Date("2024-01-15"),
    description: "Brendia Pro® - Napredni paket",
    amount: 299.99,
    status: "completed",
  },
  {
    id: "purchase-2",
    date: new Date("2024-02-01"),
    description: "Dodatni materijali",
    amount: 49.99,
    status: "completed",
  },
];
