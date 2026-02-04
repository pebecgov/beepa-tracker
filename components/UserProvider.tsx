"use client";

import { createContext, useContext, useEffect, useState } from "react";
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
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const authCheck = useQuery(api.users.isAuthorized);
  const dbUser = useQuery(api.users.getCurrentUser);
  const bootstrapAdmin = useMutation(api.users.bootstrapAdmin);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

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
