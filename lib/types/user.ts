export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  purchaseDate: Date;
  purchasePackage: "basic" | "advanced";
  subscriptionStatus: "active" | "expired" | "cancelled";
  currentLevel: 1 | 2 | 3;
  role: "user" | "admin";
  avatarUrl?: string;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface Device {
  id: string;
  name: string;
  browser: string;
  lastActive: Date;
  isCurrent: boolean;
}

export interface Purchase {
  id: string;
  date: Date;
  description: string;
  amount: number;
  status: "completed" | "pending" | "refunded";
}
