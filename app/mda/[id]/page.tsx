"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { use, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatScore } from "@/lib/utils";
import { ActivityStatus, Status } from "@/lib/types";
import { useAppUser } from "@/components/UserProvider";

interface MDAPageProps {
  params: Promise<{ id: string }>;
}

export default function MDAPage({ params }: MDAPageProps) {
  const { id } = use(params);
  const mdaId = id as Id<"mdas">;

  const [expandedReform, setExpandedReform] = useState<Id<"reforms"> | null>(null);

  const mdaPerformance = useQuery(api.performance.getMDAPerformance, { mdaId });

  if (!mdaPerformance) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    );
  }

  const { mda, score, status, reforms } = mdaPerformance;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        {/* Green accent bar */}
        <div className="h-2 bg-pebec-gradient" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 mb-4 text-sm font-medium text-white bg-[#006B3F] rounded-lg hover:bg-[#005432] transition-colors shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                {mda.abbreviation && (
                  <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-bold text-white bg-[#006B3F] rounded-lg">
                    {mda.abbreviation}
                  </span>
                )}
                <h1 className="text-2xl font-bold text-gray-900">{mda.name}</h1>
              </div>
              {mda.description && (
                <p className="text-gray-500 mt-2">{mda.description}</p>
              )}
            </div>
            <StatusBadge status={status as Status} size="lg" />
          </div>

          <div className="mt-6 bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall BEEPA Score</span>
              <span className="text-2xl font-bold text-[#006B3F]">{formatScore(score)}</span>
            </div>
            <ProgressBar score={score} color={(status as Status).color} showLabel={false} size="lg" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            BEEPA Reforms ({reforms?.length || 0})
          </h2>
          <p className="text-sm text-gray-500">
            Click on a reform to view and update activities
          </p>
        </div>

        {/* Reforms List */}
        {reforms && reforms.length > 0 ? (
          <div className="space-y-4">
            {reforms.map((reformPerf) => {
              const isExpanded = expandedReform === reformPerf.reform._id;

              return (
                <div
                  key={reformPerf.reform._id}
                  className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Reform Header */}
                  <div
                    className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedReform(isExpanded ? null : reformPerf.reform._id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <button className="text-gray-400 hover:text-gray-600 p-1">
                          <svg
                            className={`w-5 h-5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#006B3F] text-white text-sm font-bold shadow-sm">
                              {reformPerf.reform.refNumber}
                            </span>
                            <h3 className="text-base font-semibold text-gray-900">
                              {reformPerf.reform.name}
                            </h3>
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={reformPerf.status as Status} size="sm" />
                    </div>

                    <div className="flex items-center gap-4 ml-9">
                      <div className="flex-1 max-w-md">
                        <ProgressBar
                          score={reformPerf.score}
                          color={(reformPerf.status as Status).color}
                          showLabel={false}
                          size="sm"
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 min-w-[48px]">
                        {formatScore(reformPerf.score)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {reformPerf.completedCount}/{reformPerf.activityCount} activities
                      </span>
                    </div>
                  </div>

                  {/* Expanded: Activities */}
                  {isExpanded && (
                    <ActivitiesList reformId={reformPerf.reform._id} />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No reforms found for this MDA.</p>
          </div>
        )}
      </main>
    </div>
  );
}

// Activities list component
function ActivitiesList({ reformId }: { reformId: Id<"reforms"> }) {
  const { canEdit } = useAppUser();
  const activities = useQuery(api.activities.listByReform, { reformId });
  const updateCompletion = useMutation(api.activities.updateCompletion);
  const [editingActivity, setEditingActivity] = useState<Id<"activities"> | null>(null);

  const handleQuickStatus = async (
    activityId: Id<"activities">,
    newStatus: ActivityStatus
  ) => {
    if (!canEdit) {
      toast.error("You don't have permission to update activities");
      return;
    }

    const completionLevel =
      newStatus === "complete" ? 1 : newStatus === "in_progress" ? 0.5 : 0;

    try {
      await updateCompletion({
        id: activityId,
        completionLevel,
        status: newStatus,
      });
      toast.success("Activity updated!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update activity";
      toast.error(message);
    }
  };

  const handleCompletionUpdate = async (
    activityId: Id<"activities">,
    completionLevel: number
  ) => {
    if (!canEdit) {
      toast.error("You don't have permission to update activities");
      return;
    }

    // Determine status based on completion level
    let status: ActivityStatus = "not_started";
    if (completionLevel >= 1) {
      status = "complete";
    } else if (completionLevel > 0) {
      status = "in_progress";
    }

    try {
      await updateCompletion({
        id: activityId,
        completionLevel,
        status,
      });
      toast.success("Completion updated!");
      setEditingActivity(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update";
      toast.error(message);
    }
  };

  if (!activities) {
    return (
      <div className="p-5 border-t border-gray-200">
        <Skeleton className="h-12 w-full mb-2" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  // Sort by ref number
  const sortedActivities = [...activities].sort((a, b) => {
    const aNum = parseFloat(a.refNumber.split(".")[1] || "0");
    const bNum = parseFloat(b.refNumber.split(".")[1] || "0");
    return aNum - bNum;
  });

  return (
    <div className="border-t border-gray-200">
      {/* Header */}
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <div className="col-span-1">Ref</div>
        <div className="col-span-4">Activity</div>
        <div className="col-span-1 text-center">Weight</div>
        <div className="col-span-2 text-center">Completion</div>
        <div className="col-span-4 text-center">Status</div>
      </div>

      {/* Activities */}
      <div className="divide-y divide-gray-100">
        {sortedActivities.map((activity) => {
          const isEditing = editingActivity === activity._id;

          return (
            <div
              key={activity._id}
              className="px-5 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors"
            >
              {/* Ref Number */}
              <div className="col-span-1">
                <span className="text-sm font-mono text-gray-500">
                  {activity.refNumber}
                </span>
              </div>

              {/* Activity Name */}
              <div className="col-span-4">
                <p className="text-sm text-gray-900 leading-tight">{activity.name}</p>
              </div>

              {/* Weight */}
              <div className="col-span-1 text-center">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                  {Math.round(activity.weight * 100)}%
                </span>
              </div>

              {/* Completion Level */}
              <div className="col-span-2">
                {isEditing && canEdit ? (
                  <CompletionEditor
                    initialValue={activity.completionLevel}
                    onSave={(value) => handleCompletionUpdate(activity._id, value)}
                    onCancel={() => setEditingActivity(null)}
                  />
                ) : (
                  <button
                    onClick={() => canEdit && setEditingActivity(activity._id)}
                    className={`w-full flex items-center justify-center gap-2 group ${!canEdit ? "cursor-default" : ""}`}
                    disabled={!canEdit}
                  >
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${activity.completionLevel >= 0.95 ? "bg-green-500" :
                          activity.completionLevel >= 0.75 ? "bg-blue-500" :
                            activity.completionLevel >= 0.5 ? "bg-yellow-500" :
                              activity.completionLevel > 0.25 ? "bg-orange-500" : "bg-red-400"
                          }`}
                        style={{ width: `${activity.completionLevel * 100}%` }}
                      />
                    </div>
                    <span className={`text-sm font-semibold text-gray-700 min-w-[45px] text-right ${canEdit ? "group-hover:text-[#006B3F]" : ""}`}>
                      {Math.round(activity.completionLevel * 100)}%
                    </span>
                  </button>
                )}
              </div>

              {/* Quick Status Buttons or View-only Status */}
              <div className="col-span-4 flex items-center justify-center gap-1">
                {canEdit ? (
                  <>
                    <button
                      onClick={() => handleQuickStatus(activity._id, "not_started")}
                      title="Set to 0%"
                      className={`px-2 py-1.5 text-xs font-medium rounded-lg border transition-all ${activity.status === "not_started"
                        ? "bg-red-100 text-red-800 border-red-300 ring-1 ring-red-200"
                        : "bg-white text-gray-500 border-gray-200 hover:border-red-300 hover:text-red-700"
                        }`}
                    >
                      Not Started
                    </button>
                    <button
                      onClick={() => handleQuickStatus(activity._id, "complete")}
                      title="Set to 100%"
                      className={`px-2 py-1.5 text-xs font-medium rounded-lg border transition-all ${activity.status === "complete"
                        ? "bg-[#006B3F] text-white border-[#006B3F] ring-1 ring-[#006B3F]/30 shadow-sm"
                        : "bg-white text-gray-500 border-gray-200 hover:border-[#006B3F] hover:text-[#006B3F]"
                        }`}
                    >
                      Complete
                    </button>
                  </>
                ) : (
                  <span className={`px-3 py-1.5 text-xs font-medium rounded-lg ${activity.status === "complete"
                    ? "bg-[#006B3F]/10 text-[#006B3F]"
                    : activity.status === "in_progress"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                    }`}>
                    {activity.status === "complete" ? "Complete" : activity.status === "in_progress" ? "In Progress" : "Not Started"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-gray-500">
            {sortedActivities.filter((a) => a.status === "complete").length} of{" "}
            {sortedActivities.length} activities complete
          </span>
          {!canEdit && (
            <span className="text-gray-400 text-xs">
              View only
            </span>
          )}
        </div>
        <span className="font-medium text-gray-700">
          Weighted Score:{" "}
          <span className="text-gray-900 font-bold">
            {formatScore(
              sortedActivities.reduce(
                (sum, a) => sum + a.completionLevel * a.weight,
                0
              )
            )}
          </span>
        </span>
      </div>
    </div>
  );
}

// Inline completion editor component
function CompletionEditor({
  initialValue,
  onSave,
  onCancel,
}: {
  initialValue: number;
  onSave: (value: number) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(Math.round(initialValue * 100));

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min="0"
        max="100"
        value={value}
        onChange={(e) => setValue(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
        className="w-14 px-2 py-1 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#006B3F]"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(value / 100);
          if (e.key === "Escape") onCancel();
        }}
      />
      <span className="text-xs text-gray-500">%</span>
      <button
        onClick={() => onSave(value / 100)}
        className="p-1 text-[#006B3F] hover:bg-[#006B3F]/10 rounded"
        title="Save"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </button>
      <button
        onClick={onCancel}
        className="p-1 text-gray-400 hover:bg-gray-100 rounded"
        title="Cancel"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
