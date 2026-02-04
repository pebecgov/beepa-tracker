"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface UserContextType {
  isLoading: boolean;
  isSignedIn: boolean;
  isAuthorized: boolean;
  authError: string | null;
  user: any;
  role: "admin" | "editor" | "viewer" | null;
  canEdit: boolean;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType>({
  isLoading: true,
  isSignedIn: false,
  isAuthorized: false,
  authError: null,
  user: null,
  role: null,
  canEdit: false,
  isAdmin: false,
});

export function useAppUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  const authCheck = useQuery(api.users.isAuthorized);
  const dbUser = useQuery(api.users.getCurrentUser);
  const bootstrapAdmin = useMutation(api.users.bootstrapAdmin);
  const linkPendingUser = useMutation(api.users.linkPendingUser);
  
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const hasLinked = useRef(false);

  // Link pending user on sign-in (if they were invited by email)
  useEffect(() => {
    const linkUser = async () => {
      if (isLoaded && isSignedIn && !hasLinked.current) {
        // Try to link if:
        // 1. User exists but is pending
        // 2. User is not found (might be pending with email mismatch)
        // 3. authCheck says user exists but getCurrentUser didn't find them
        const shouldLink = 
          (dbUser !== undefined && dbUser?.status === "pending") ||
          (dbUser === null && authCheck !== undefined);
        
        if (shouldLink) {
          hasLinked.current = true;
          try {
            await linkPendingUser();
          } catch (error) {
            console.error("Error linking user:", error);
          }
        }
      }
    };
    linkUser();
  }, [isLoaded, isSignedIn, dbUser, authCheck, linkPendingUser]);

  // Handle bootstrap for first admin
  useEffect(() => {
    const handleBootstrap = async () => {
      if (
        isLoaded && 
        isSignedIn && 
        authCheck?.reason === "not_invited" && 
        !isBootstrapping &&
        !bootstrapError
      ) {
        // Check if this could be the first user by trying to bootstrap
        setIsBootstrapping(true);
        try {
          await bootstrapAdmin();
          // Refresh will happen automatically via Convex reactivity
        } catch (error: any) {
          // If bootstrap fails, it means there are existing users
          setBootstrapError(error.message);
        } finally {
          setIsBootstrapping(false);
        }
      }
    };
    handleBootstrap();
  }, [isLoaded, isSignedIn, authCheck, bootstrapAdmin, isBootstrapping, bootstrapError]);

  // Determine loading state
  const isLoading = !isLoaded || (isSignedIn && (authCheck === undefined || dbUser === undefined));

  // Determine authorization
  const isAuthorized = authCheck?.authorized || false;
  const authError = authCheck?.reason || null;

  // User data
  const user = dbUser;
  const role = user?.role || null;
  const canEdit = (role === "admin" || role === "editor") && user?.status === "active";
  const isAdmin = role === "admin" && user?.status === "active";

  return (
    <UserContext.Provider
      value={{
        isLoading: isLoading || isBootstrapping,
        isSignedIn: !!isSignedIn,
        isAuthorized,
        authError: bootstrapError || authError,
        user,
        role,
        canEdit,
        isAdmin,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
