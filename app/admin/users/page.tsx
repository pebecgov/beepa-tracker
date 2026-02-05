"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import Link from "next/link";
import { useAppUser } from "@/components/UserProvider";
import { Skeleton } from "@/components/ui/Skeleton";

type Role = "admin" | "editor" | "viewer";

export default function AdminUsersPage() {
  const { isAdmin, isLoading: userLoading } = useAppUser();
  const users = useQuery(api.users.list);
  const accessCode = useQuery(api.users.getAccessCode);
  const updateRole = useMutation(api.users.updateRole);
  const removeUser = useMutation(api.users.remove);
  const regenerateCode = useMutation(api.users.regenerateAccessCode);

  const [showCode, setShowCode] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-4">You need admin privileges to access this page.</p>
          <Link href="/" className="text-[#006B3F] hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const handleUpdateRole = async (userId: Id<"users">, role: Role) => {
    try {
      await updateRole({ userId, role });
      toast.success("Role updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  const handleDeleteUser = async (userId: Id<"users">) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      await removeUser({ id: userId });
      toast.success("User deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  const handleRegenerateCode = async () => {
    if (!confirm("This will invalidate the current code. Users with the old code won't be able to register as editor/admin. Continue?")) return;
    
    setIsRegenerating(true);
    try {
      const newCode = await regenerateCode();
      toast.success("Access code regenerated!");
      setShowCode(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to regenerate code");
    } finally {
      setIsRegenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (accessCode) {
      navigator.clipboard.writeText(accessCode);
      toast.success("Code copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-pebec-gradient shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-green-100 hover:text-white text-sm mb-2 inline-block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-white">User Management</h1>
              <p className="text-green-100 mt-1">Manage users and access codes</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Access Code Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Access Code</h2>
              <p className="text-sm text-gray-500">
                Share this code with users who need editor or admin access
              </p>
            </div>
            <button
              onClick={handleRegenerateCode}
              disabled={isRegenerating}
              className="px-3 py-1.5 text-sm font-medium text-[#006B3F] hover:bg-[#006B3F]/5 rounded-lg transition-colors disabled:opacity-50"
            >
              {isRegenerating ? "Regenerating..." : "Regenerate Code"}
            </button>
          </div>
          
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 bg-gray-100 rounded-lg p-4 font-mono text-2xl tracking-[0.3em] text-center">
              {showCode ? accessCode : "••••••••"}
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowCode(!showCode)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {showCode ? "Hide" : "Show"}
              </button>
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 text-sm font-medium text-white bg-[#006B3F] hover:bg-[#005432] rounded-lg transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
          
          <p className="text-xs text-gray-400 mt-3">
            Users need this code when registering as an Editor or Admin
          </p>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#006B3F] to-[#008B52]" />
          
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
            <p className="text-sm text-gray-500">{users?.length || 0} registered users</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Joined</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Last Login</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users?.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{user.name || "No name"}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user._id, e.target.value as Role)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-lg border ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800 border-purple-200"
                            : user.role === "editor"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-gray-100 text-gray-800 border-gray-200"
                        }`}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.lastLoginAt 
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : "Never"
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {(!users || users.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Role Explanation */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded">Viewer</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• View all MDAs and reforms</li>
                <li>• View activity statuses</li>
                <li>• Cannot make changes</li>
                <li>• No access code needed</li>
              </ul>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 text-xs font-medium bg-blue-200 text-blue-700 rounded">Editor</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• All Viewer permissions</li>
                <li>• Update activity completion</li>
                <li>• Requires access code to register</li>
              </ul>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 text-xs font-medium bg-purple-200 text-purple-700 rounded">Admin</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• All Editor permissions</li>
                <li>• Manage users and roles</li>
                <li>• View and regenerate access code</li>
                <li>• Requires access code to register</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
