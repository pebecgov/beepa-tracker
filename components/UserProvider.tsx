"use client";

import { createContext, useContext, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface UserContextType {
  isLoading: boolean;
  isSignedIn: boolean;
  user: any;
  role: "admin" | "editor" | "viewer" | null;
  canEdit: boolean;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType>({
  isLoading: true,
  isSignedIn: false,
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
  const dbUser = useQuery(api.users.getCurrentUser);
  const registerUser = useMutation(api.users.registerCurrentUser);

  // Register user on first sign-in
  useEffect(() => {
    const register = async () => {
      if (isLoaded && isSignedIn && dbUser === null) {
        try {
          await registerUser();
        } catch (error) {
          // User might already exist or other error
          console.error("Error registering user:", error);
        }
      }
    };
    register();
  }, [isLoaded, isSignedIn, dbUser, registerUser]);

  const isLoading = !isLoaded || (isSignedIn && dbUser === undefined);
  const role = dbUser?.role || null;
  const canEdit = role === "admin" || role === "editor";
  const isAdmin = role === "admin";

  return (
    <UserContext.Provider
      value={{
        isLoading,
        isSignedIn: !!isSignedIn,
        user: dbUser,
        role,
        canEdit,
        isAdmin,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
