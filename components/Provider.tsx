"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

import { Toaster } from "sonner";
import { UserProvider } from "./UserProvider";

// Create client only if URL is available (handles build-time)
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function Provider({ children }: { children: React.ReactNode }) {
    // During build/SSG when Convex URL is not available, render children without Convex
    if (!convex) {
        return (
            <>
                {children}
                <Toaster />
            </>
        );
    }

    return (
        <ClerkProvider>
            <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
                <UserProvider>
                    {children}
                </UserProvider>
            </ConvexProviderWithClerk>
            <Toaster />
        </ClerkProvider>
    );
}
