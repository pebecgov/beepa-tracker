"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { UserButton, useClerk, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { useAppUser } from "./UserProvider";

import { StatCard } from "./ui/StatCard";
import { RankingTable } from "./RankingTable";
import { StatusDistribution } from "./StatusDistribution";
import { ProgressTimeline } from "./ProgressTimeline";
import { MDACard } from "./MDACard";
import { StatCardSkeleton, CardSkeleton, TableSkeleton } from "./ui/Skeleton";
import { formatScore } from "@/lib/utils";
import { MDAPerformance, DashboardStats } from "@/lib/types";

type ViewMode = "ranking" | "grid";

export function Dashboard() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { isSignedIn, isAuthorized, isAdmin, role, isLoading: userLoading, authError } = useAppUser();
  const [viewMode, setViewMode] = useState<ViewMode>("ranking");
  const [searchQuery, setSearchQuery] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const hasInitialized = useRef(false);

  const stats = useQuery(api.performance.getDashboardStats);
  const rankings = useQuery(api.performance.getRankedMDAs);
  const hasAnyUsers = useQuery(api.users.hasAnyUsers);

  // Filter rankings by search query
  const filteredRankings = rankings?.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.mda.name.toLowerCase().includes(query) ||
      item.mda.abbreviation?.toLowerCase().includes(query)
    );
  });

  const seedDb = useMutation(api.seed.seedDatabase);
  const clearDb = useMutation(api.seed.clearDatabase);

  // Auto-initialize database if empty
  useEffect(() => {
    const initializeIfEmpty = async () => {
      if (
        stats !== undefined &&
        stats.totalMDAs === 0 &&
        !isInitializing &&
        !hasInitialized.current
      ) {
        hasInitialized.current = true;
        setIsInitializing(true);
        try {
          const result = await seedDb();
          toast.success(`Initialized ${result.stats.mdas} MDAs with BEEPA framework!`);
        } catch (error: any) {
          // If error is about existing data, ignore it
          if (!error.message?.includes("already has data")) {
            toast.error("Failed to initialize database");
          }
        } finally {
          setIsInitializing(false);
        }
      }
    };

    initializeIfEmpty();
  }, [stats, seedDb, isInitializing]);

  const handleSeed = async () => {
    try {
      const result = await seedDb();
      toast.success(`Seeded ${result.stats.mdas} MDAs with ${result.stats.activities} activities!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to seed database");
    }
  };

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear all data?")) return;
    try {
      await clearDb();
      toast.success("Database cleared successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to clear database");
    }
  };

  const handleMDAClick = (mda: MDAPerformance) => {
    router.push(`/mda/${mda.mda._id}`);
  };

  // Show setup screen when no users exist (first-time setup)
  if (hasAnyUsers === false && !isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <img 
            src="/pebec-logo.png" 
            alt="PEBEC Logo" 
            className="h-20 w-auto mx-auto mb-6"
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to BEEPA Tracker</h1>
          <p className="text-gray-500 mb-6">
            Set up your admin account to get started. You'll be the first administrator.
          </p>
          <SignInButton mode="modal">
            <button className="w-full px-4 py-3 text-white bg-[#006B3F] font-medium rounded-lg hover:bg-[#005432] transition-colors shadow-md">
              Create Admin Account
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  // Show access denied for signed-in but unauthorized users
  if (isSignedIn && !isAuthorized && !userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-6">
            {authError === "not_invited" 
              ? "You haven't been invited to this system. Please contact an administrator to request access."
              : authError === "deactivated"
              ? "Your account has been deactivated. Please contact an administrator."
              : "You don't have permission to access this system."
            }
          </p>
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="px-4 py-2 text-sm font-medium text-white bg-[#006B3F] rounded-lg hover:bg-[#005432] transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-pebec-gradient sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <img 
                src="/pebec-logo.png" 
                alt="PEBEC Logo" 
                className="h-14 w-auto bg-white rounded-lg p-1 shadow-md"
              />
              <div>
                <h1 className="text-xl font-bold text-white">BEEPA Reform Tracker</h1>
                <p className="text-sm text-green-100">90-Day Performance Monitoring Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <>
                  <Link
                    href="/admin/users"
                    className="px-4 py-2 text-sm font-medium text-white bg-white/10 border border-white/30 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Manage Users
                  </Link>
                  <button
                    onClick={handleSeed}
                    className="px-4 py-2 text-sm font-medium text-[#006B3F] bg-white border border-white/20 rounded-lg hover:bg-green-50 transition-colors shadow-md"
                  >
                    Seed Data
                  </button>
                  <button
                    onClick={handleClear}
                    className="px-4 py-2 text-sm font-medium text-white bg-white/10 border border-white/30 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Clear Data
                  </button>
                </>
              )}
              {isSignedIn ? (
                <div className="flex items-center gap-2">
                  {role && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      role === "admin" ? "bg-purple-200 text-purple-800" :
                      role === "editor" ? "bg-blue-200 text-blue-800" :
                      "bg-gray-200 text-gray-700"
                    }`}>
                      {role}
                    </span>
                  )}
                  <UserButton afterSignOutUrl="/" />
                </div>
              ) : (
                <SignInButton mode="modal">
                  <button className="px-4 py-2 text-sm font-medium text-[#006B3F] bg-white rounded-lg hover:bg-green-50 transition-colors shadow-md">
                    Sign In
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats ? (
              <>
                <StatCard
                  title="Total MDAs"
                  value={stats.totalMDAs}
                  subtitle="Ministries, Departments & Agencies"
                  icon={
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                />
                <StatCard
                  title="Total Reforms"
                  value={stats.totalReforms}
                  subtitle="7 reforms per MDA"
                  icon={
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  }
                />
                <StatCard
                  title="Total Activities"
                  value={stats.totalActivities}
                  subtitle={`${stats.activityStats.complete} complete, ${stats.activityStats.inProgress} in progress`}
                  icon={
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                />
                <StatCard
                  title="Average Score"
                  value={formatScore(stats.averageScore)}
                  subtitle={stats.overallStatus.label}
                  icon={
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  }
                />
              </>
            ) : (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            )}
          </div>
        </section>

        {/* Status Distribution */}
        {stats && stats.totalMDAs > 0 && (
          <>
            <section className="mb-8">
              <StatusDistribution stats={stats as DashboardStats} />
            </section>
            
            <section className="mb-8">
              <ProgressTimeline />
            </section>
          </>
        )}

        {/* Rankings / Grid Toggle */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">MDA Rankings</h2>
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search MDA..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-64 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006B3F] focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#006B3F]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode("ranking")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === "ranking"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === "grid"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Grid
                </button>
              </div>
            </div>
          </div>

          {/* Search results count */}
          {searchQuery && filteredRankings && (
            <p className="text-sm text-gray-500 mb-3">
              Found {filteredRankings.length} of {rankings?.length || 0} MDAs
            </p>
          )}

          {filteredRankings ? (
            filteredRankings.length > 0 ? (
              viewMode === "ranking" ? (
                <RankingTable rankings={filteredRankings as MDAPerformance[]} onRowClick={handleMDAClick} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRankings.map((mda) => (
                    <MDACard
                      key={mda.mda._id}
                      performance={mda as MDAPerformance}
                      showRank
                      onClick={() => handleMDAClick(mda as MDAPerformance)}
                    />
                  ))}
                </div>
              )
            ) : searchQuery ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <svg
                  className="w-12 h-12 text-gray-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No MDAs found</h3>
                <p className="text-gray-500 mb-4">
                  No results for "{searchQuery}". Try a different search term.
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Clear search
                </button>
              </div>
            ) : null
          ) : viewMode === "ranking" ? (
            <TableSkeleton rows={5} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          )}

          {(rankings && rankings.length === 0 && !searchQuery) || isInitializing ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              {isInitializing ? (
                <>
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Initializing BEEPA Framework...</h3>
                  <p className="text-gray-500">
                    Creating 69 MDAs with 7 reforms and 52 activities each.
                  </p>
                </>
              ) : (
                <>
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Initializing...</h3>
                  <p className="text-gray-500 mb-4">
                    Setting up the BEEPA Reform Framework.
                  </p>
                <button
                  onClick={handleSeed}
                  className="px-4 py-2 bg-[#006B3F] text-white font-medium rounded-lg hover:bg-[#005432] transition-colors shadow-md"
                >
                  Initialize Now
                </button>
                </>
              )}
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}
