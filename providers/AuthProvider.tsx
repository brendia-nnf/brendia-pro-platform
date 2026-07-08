"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Profile } from "@/lib/supabase/types";

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

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const supabase = createClient();

  // Transform Supabase user + profile to our User type
  const transformUser = useCallback(
    async (supabaseUser: SupabaseUser): Promise<User | null> => {
      try {
        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", supabaseUser.id)
          .single();

        // Fetch enrollment to get package info
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("*")
          .eq("user_id", supabaseUser.id)
          .eq("status", "active")
          .order("purchased_at", { ascending: false })
          .limit(1)
          .single();

        // Fetch progress to determine current level
        const { data: progress } = await supabase.rpc("get_user_progress", {
          p_user_id: supabaseUser.id,
        });

        // Determine current level based on progress
        let currentLevel: 1 | 2 | 3 = 1;
        if (progress && progress.length > 0) {
          // Find highest level with some progress
          for (const p of progress) {
            if (p.progress_percentage > 0 && p.level_number > currentLevel) {
              currentLevel = p.level_number as 1 | 2 | 3;
            }
          }
        }

        return {
          id: supabaseUser.id,
          email: supabaseUser.email || "",
          fullName: profile?.full_name || supabaseUser.user_metadata?.full_name || "",
          phone: profile?.phone || undefined,
          purchaseDate: enrollment?.purchased_at
            ? new Date(enrollment.purchased_at)
            : new Date(),
          purchasePackage: enrollment?.package || "basic",
          subscriptionStatus: enrollment?.status === "active" ? "active" : "expired",
          currentLevel,
          role: (profile?.role as "user" | "admin") || "user",
          avatarUrl: profile?.avatar_url || undefined,
          createdAt: new Date(supabaseUser.created_at),
          lastLoginAt: supabaseUser.last_sign_in_at
            ? new Date(supabaseUser.last_sign_in_at)
            : undefined,
        };
      } catch (error) {
        console.error("Error transforming user:", error);
        return null;
      }
    },
    [supabase]
  );

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const user = await transformUser(session.user);
          setState({
            user,
            isAuthenticated: !!user,
            isLoading: false,
          });
        } else {
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error("Session check error:", error);
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const user = await transformUser(session.user);
        setState({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        });
      } else if (event === "SIGNED_OUT") {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        // Refresh user data on token refresh
        const user = await transformUser(session.user);
        setState((prev) => ({
          ...prev,
          user,
        }));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, transformUser]);

  const login = async (
    credentials: LoginCredentials
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const user = await transformUser(data.user);
        setState({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        });

        // Register device
        try {
          const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : "";
          await supabase.rpc("register_device", {
            p_user_id: data.user.id,
            p_device_name: getDeviceName(userAgent),
            p_device_type: getDeviceType(userAgent),
            p_browser: getBrowser(userAgent),
            p_os: getOS(userAgent),
            p_user_agent: userAgent,
          });
        } catch (deviceError) {
          console.error("Error registering device:", deviceError);
        }

        return { success: true };
      }

      return { success: false, error: "Login failed" };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const register = async (
    data: RegisterData
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (authData.user) {
        // Profile is created automatically via trigger
        // Update with phone if provided
        if (data.phone) {
          await supabase
            .from("profiles")
            .update({ phone: data.phone })
            .eq("id", authData.user.id);
        }

        return { success: true };
      }

      return { success: false, error: "Registration failed" };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!state.user) return;

    try {
      const profileUpdates: Partial<Profile> = {};

      if (updates.fullName !== undefined) {
        profileUpdates.full_name = updates.fullName;
      }
      if (updates.phone !== undefined) {
        profileUpdates.phone = updates.phone;
      }
      if (updates.avatarUrl !== undefined) {
        profileUpdates.avatar_url = updates.avatarUrl;
      }

      if (Object.keys(profileUpdates).length > 0) {
        const { error } = await supabase
          .from("profiles")
          .update(profileUpdates)
          .eq("id", state.user.id);

        if (error) throw error;
      }

      setState((prev) => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updates } : null,
      }));
    } catch (error) {
      console.error("Update user error:", error);
      throw error;
    }
  };

  const resetPassword = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/hr/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Reset password error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const updatePassword = async (
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Update password error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const refreshUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      const user = await transformUser(session.user);
      setState((prev) => ({
        ...prev,
        user,
      }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateUser,
        resetPassword,
        updatePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Helper functions for device detection
function getDeviceName(userAgent: string): string {
  if (/iPhone/.test(userAgent)) return "iPhone";
  if (/iPad/.test(userAgent)) return "iPad";
  if (/Android/.test(userAgent)) {
    const match = userAgent.match(/Android[^;]*;\s*([^)]+)/);
    return match ? match[1].trim() : "Android Device";
  }
  if (/Windows/.test(userAgent)) return "Windows PC";
  if (/Mac/.test(userAgent)) return "Mac";
  if (/Linux/.test(userAgent)) return "Linux";
  return "Unknown Device";
}

function getDeviceType(userAgent: string): "mobile" | "tablet" | "desktop" | "unknown" {
  if (/Mobile/.test(userAgent) || /iPhone/.test(userAgent)) return "mobile";
  if (/iPad/.test(userAgent) || /Tablet/.test(userAgent)) return "tablet";
  if (/Windows|Mac|Linux/.test(userAgent)) return "desktop";
  return "unknown";
}

function getBrowser(userAgent: string): string {
  if (/Chrome/.test(userAgent) && !/Edg/.test(userAgent)) return "Chrome";
  if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) return "Safari";
  if (/Firefox/.test(userAgent)) return "Firefox";
  if (/Edg/.test(userAgent)) return "Edge";
  if (/Opera|OPR/.test(userAgent)) return "Opera";
  return "Unknown";
}

function getOS(userAgent: string): string {
  if (/Windows NT 10/.test(userAgent)) return "Windows 10/11";
  if (/Windows/.test(userAgent)) return "Windows";
  if (/Mac OS X/.test(userAgent)) {
    const match = userAgent.match(/Mac OS X ([\d_]+)/);
    return match ? `macOS ${match[1].replace(/_/g, ".")}` : "macOS";
  }
  if (/iPhone OS ([\d_]+)/.test(userAgent)) {
    const match = userAgent.match(/iPhone OS ([\d_]+)/);
    return match ? `iOS ${match[1].replace(/_/g, ".")}` : "iOS";
  }
  if (/Android ([\d.]+)/.test(userAgent)) {
    const match = userAgent.match(/Android ([\d.]+)/);
    return match ? `Android ${match[1]}` : "Android";
  }
  if (/Linux/.test(userAgent)) return "Linux";
  return "Unknown";
}
