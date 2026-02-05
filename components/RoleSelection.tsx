"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

type Role = "admin" | "editor" | "viewer";

export function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState<Role>("viewer");
  const [accessCode, setAccessCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const hasAnyUsers = useQuery(api.users.hasAnyUsers);
  const registerUser = useMutation(api.users.registerUser);

  const isFirstUser = hasAnyUsers === false;
  const needsAccessCode = !isFirstUser && selectedRole !== "viewer";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await registerUser({
        role: isFirstUser ? "admin" : selectedRole,
        accessCode: needsAccessCode ? accessCode : undefined,
      });

      if (result.isFirstUser) {
        toast.success("Welcome! You are the first admin.");
      } else {
        toast.success(`Account created as ${result.role}!`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <img 
            src="/pebec-logo.png" 
            alt="PEBEC Logo" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-gray-900">
            {isFirstUser ? "Welcome, Admin!" : "Complete Your Registration"}
          </h1>
          <p className="text-gray-500 mt-2">
            {isFirstUser 
              ? "You're the first user. You'll be set up as the administrator."
              : "Select your role to continue."
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isFirstUser && (
            <>
              {/* Role Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Select Your Role
                </label>
                
                <div className="space-y-2">
                  <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedRole === "viewer" 
                      ? "border-[#006B3F] bg-[#006B3F]/5" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="viewer"
                      checked={selectedRole === "viewer"}
                      onChange={() => setSelectedRole("viewer")}
                      className="mt-1 text-[#006B3F] focus:ring-[#006B3F]"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Viewer</span>
                      <p className="text-sm text-gray-500">
                        View all MDAs, reforms, and activity statuses. Cannot make changes.
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedRole === "editor" 
                      ? "border-[#006B3F] bg-[#006B3F]/5" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="editor"
                      checked={selectedRole === "editor"}
                      onChange={() => setSelectedRole("editor")}
                      className="mt-1 text-[#006B3F] focus:ring-[#006B3F]"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Editor</span>
                      <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                        Requires Access Code
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        All viewer permissions plus ability to update activity completion levels.
                      </p>
                    </div>
                  </label>

                  <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedRole === "admin" 
                      ? "border-[#006B3F] bg-[#006B3F]/5" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}>
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={selectedRole === "admin"}
                      onChange={() => setSelectedRole("admin")}
                      className="mt-1 text-[#006B3F] focus:ring-[#006B3F]"
                    />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Admin</span>
                      <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                        Requires Access Code
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        Full access including user management and system settings.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Access Code Input */}
              {needsAccessCode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Access Code
                  </label>
                  <input
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    placeholder="Enter 8-character code"
                    maxLength={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006B3F] focus:border-transparent text-center text-lg tracking-widest font-mono uppercase"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Get this code from an administrator
                  </p>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting || (needsAccessCode && accessCode.length < 8)}
            className="w-full px-4 py-3 text-white bg-[#006B3F] font-medium rounded-lg hover:bg-[#005432] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating Account...
              </>
            ) : isFirstUser ? (
              "Set Up Admin Account"
            ) : (
              "Complete Registration"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
