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
  const mdas = useQuery(api.mdas.list);
  const inviteUser = useMutation(api.users.invite);
  const updateUser = useMutation(api.users.update);
  const removeUser = useMutation(api.users.remove);
  const getInviteEmail = useMutation(api.users.getInviteEmail);

  const [showAddForm, setShowAddForm] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // Form state for adding new user
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    role: "viewer" as Role,
    assignedMDAs: [] as Id<"mdas">[],
  });

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

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email) {
      toast.error("Email is required");
      return;
    }

    setIsInviting(true);
    try {
      // Step 1: Create user record in Convex (pending status)
      const result = await inviteUser({
        email: newUser.email,
        name: newUser.name || undefined,
        role: newUser.role,
        assignedMDAs: newUser.assignedMDAs.length > 0 ? newUser.assignedMDAs : undefined,
      });

      // Step 2: Send Clerk invitation email
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: result.email }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // User created in DB but invitation failed - still success, can resend
        toast.warning(`User added but invitation email failed: ${data.error}. You can resend the invitation.`);
      } else {
        toast.success(`Invitation sent to ${result.email}!`);
      }

      setShowAddForm(false);
      setNewUser({ email: "", name: "", role: "viewer", assignedMDAs: [] });
    } catch (error: any) {
      toast.error(error.message || "Failed to invite user");
    } finally {
      setIsInviting(false);
    }
  };

  const handleResendInvite = async (userId: Id<"users">) => {
    try {
      const { email } = await getInviteEmail({ id: userId });
      
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Failed to send invitation");
      } else {
        toast.success(`Invitation resent to ${email}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to resend invitation");
    }
  };

  const handleUpdateRole = async (userId: Id<"users">, role: Role) => {
    try {
      await updateUser({ id: userId, role });
      toast.success("Role updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  const handleToggleStatus = async (userId: Id<"users">, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await updateUser({ id: userId, status: newStatus as "active" | "inactive" });
      toast.success(newStatus === "active" ? "User activated" : "User deactivated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
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
              <p className="text-green-100 mt-1">Manage user roles and access</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-white text-[#006B3F] font-medium rounded-lg hover:bg-green-50 transition-colors shadow-md"
            >
              {showAddForm ? "Cancel" : "Add User"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Invite User Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Invite New User</h2>
            <p className="text-sm text-gray-500 mb-4">
              The user will receive an email invitation to join the system.
            </p>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006B3F] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (optional)</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006B3F] focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as Role })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#006B3F] focus:border-transparent"
                  >
                    <option value="viewer">Viewer (Read-only)</option>
                    <option value="editor">Editor (Can update activities)</option>
                    <option value="admin">Admin (Full access)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  disabled={isInviting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="px-4 py-2 bg-[#006B3F] text-white font-medium rounded-lg hover:bg-[#005432] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isInviting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Invitation"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#006B3F] to-[#008B52]" />
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Invited</th>
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
                        {user.lastLoginAt && (
                          <div className="text-xs text-gray-400">
                            Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                          </div>
                        )}
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
                    <td className="px-6 py-4">
                      {user.status === "pending" ? (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(user._id, user.status)}
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            user.status === "active"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                        >
                          {user.status === "active" ? "Active" : "Inactive"}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.invitedAt 
                        ? new Date(user.invitedAt).toLocaleDateString()
                        : new Date(user.createdAt).toLocaleDateString()
                      }
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {user.status === "pending" && (
                        <button
                          onClick={() => handleResendInvite(user._id)}
                          className="text-[#006B3F] hover:text-[#005432] text-sm font-medium"
                        >
                          Resend Invite
                        </button>
                      )}
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
                      No users found. Invite your first user above.
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
              </ul>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 text-xs font-medium bg-blue-200 text-blue-700 rounded">Editor</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• All Viewer permissions</li>
                <li>• Update activity completion</li>
                <li>• Can be restricted to specific MDAs</li>
              </ul>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 text-xs font-medium bg-purple-200 text-purple-700 rounded">Admin</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• All Editor permissions</li>
                <li>• Manage users and roles</li>
                <li>• Full system access</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
