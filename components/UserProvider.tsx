"use client";

import { createContext, useContext, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface UserContextType {
  isLoading: boolean;
  isSignedIn: boolean;
  needsRoleSelection: boolean;
  user: any;
  role: "admin" | "editor" | "viewer" | null;
  canEdit: boolean;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType>({
  isLoading: true,
  isSignedIn: false,
  needsRoleSelection: false,
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
  const dbUser = useQuery(api.users.getCurrentUser);
  const needsRole = useQuery(api.users.needsRoleSelection);
  const updateLastLogin = useMutation(api.users.updateLastLogin);

  // Update last login when user signs in
  useEffect(() => {
    if (isLoaded && isSignedIn && dbUser) {
      updateLastLogin();
    }
  }, [isLoaded, isSignedIn, dbUser, updateLastLogin]);

  // Determine loading state
  const isLoading = !isLoaded || (isSignedIn && (dbUser === undefined || needsRole === undefined));

  // User data
  const user = dbUser;
  const role = user?.role || null;
  const canEdit = role === "admin" || role === "editor";
  const isAdmin = role === "admin";

  return (
    <UserContext.Provider
      value={{
        isLoading,
        isSignedIn: !!isSignedIn,
        needsRoleSelection: needsRole === true,
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
