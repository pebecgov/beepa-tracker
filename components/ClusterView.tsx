"use client";

import { useState } from "react";
import { CLUSTERS } from "@/lib/cluster-data";
import { MDAPerformance } from "@/lib/types";
import { StatusBadge } from "./ui/StatusBadge";
import { ProgressBar } from "./ui/ProgressBar";
import { formatScore } from "@/lib/utils";

interface ClusterViewProps {
    rankings: MDAPerformance[];
    onRowClick?: (mda: MDAPerformance) => void;
}

export function ClusterView({ rankings, onRowClick }: ClusterViewProps) {
    const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);

    const toggleCluster = (id: string) => {
        setExpandedClusterId(expandedClusterId === id ? null : id);
    };

    // Helper to find matching MDA performance data
    const getMDAPerformance = (clusterMdaName: string) => {
        if (!rankings) return undefined;

        // Normalize string for comparison
        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
        const search = normalize(clusterMdaName);

        return rankings.find(r => {
            const dbName = normalize(r.mda.name);
            return dbName.includes(search) || search.includes(dbName) ||
                (r.mda.abbreviation && search.includes(normalize(r.mda.abbreviation)));
        });
    };

    // Helper to calculate cluster average score
    const getClusterStats = (members: { name: string }[]) => {
        if (!rankings) return { score: 0, count: 0 };

        let totalScore = 0;
        let count = 0;

        members.forEach(member => {
            const perf = getMDAPerformance(member.name);
            if (perf) {
                totalScore += perf.score;
                count++;
            }
        });

        return {
            score: count > 0 ? totalScore / count : 0,
            count
        };
    };

    // Prepare and sort clusters
    // We prioritize score, then name for consistent sorting
    const sortedClusters = [...CLUSTERS].map(cluster => ({
        ...cluster,
        stats: getClusterStats(cluster.members)
    })).sort((a, b) => {
        const diff = b.stats.score - a.stats.score;
        // Use a small epsilon for float comparison stability
        if (Math.abs(diff) > 0.0001) return diff;
        return a.name.localeCompare(b.name); // Tie-breaker: Name
    });

    return (
        <div className="space-y-4">
            {sortedClusters.map((cluster, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;

                // Sort members within the cluster for display
                const sortedMembers = [...cluster.members].map(member => {
                    const perf = getMDAPerformance(member.name);
                    return { ...member, perf };
                }).sort((a, b) => {
                    const scoreA = a.perf?.score || 0;
                    const scoreB = b.perf?.score || 0;
                    return scoreB - scoreA;
                });

                return (
                    <div
                        key={cluster.id}
                        className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden flex ${expandedClusterId === cluster.id
                            ? "border-[#006B3F] shadow-md ring-1 ring-[#006B3F]/20"
                            : "border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300"
                            }`}
                    >
                        {/* Rank Indicator - Vertical bar on left */}
                        <div className={`w-12 flex-shrink-0 flex items-center justify-center border-r border-gray-100 ${isTop3 ? "bg-gradient-to-b from-[#006B3F]/10 to-white" : "bg-gray-50"
                            }`}>
                            <div className={`text-xl font-bold ${rank === 1 ? "text-[#006B3F]" :
                                rank === 2 ? "text-[#006B3F]/80" :
                                    rank === 3 ? "text-[#006B3F]/60" : "text-gray-400"
                                }`}>
                                #{rank}
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            {/* Cluster Header / Accordion Toggle */}
                            <button
                                onClick={() => toggleCluster(cluster.id)}
                                className={`w-full text-left px-6 py-5 flex items-center justify-between transition-colors ${expandedClusterId === cluster.id ? "bg-gray-50/50" : "bg-white"
                                    }`}
                            >
                                <div className="flex-1 pr-4">
                                    <h3 className={`text-lg font-semibold truncate ${expandedClusterId === cluster.id ? "text-[#006B3F]" : "text-gray-900"
                                        }`}>
                                        {cluster.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {cluster.members.length} MDAs  
                                    </p>
                                    <p className="mt-1">
                                         <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Cluster Lead:</span>
                                            <span className="text-sm font-medium text-[#006B3F] bg-[#006B3F]/5 px-2 py-1 rounded-md">
                                                {cluster.lead}
                                            </span>
                                    </p>
                                </div>

                                <div className="flex items-center gap-6 flex-shrink-0">
                                    {/* Cluster Score Info */}
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-gray-900">
                                            {formatScore(cluster.stats.score)}
                                        </div>
                                        <div className="text-xs text-gray-500">Average Performance</div>
                                    </div>

                                    <div className={`p-2 rounded-full transition-colors ${expandedClusterId === cluster.id ? "bg-[#006B3F]/10 text-[#006B3F]" : "text-gray-400 bg-gray-100"
                                        }`}>
                                        <svg
                                            className={`w-5 h-5 transform transition-transform duration-200 ${expandedClusterId === cluster.id ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </button>

                            {/* Expanded Content */}
                            {expandedClusterId === cluster.id && (
                                <div className="border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">
                                    {/* Cluster Level Details */}
                                  

                                    {/* Members Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gradient-to-r from-[#006B3F] to-[#008B52] text-white">
                                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider w-16">Rank</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">MDA</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider w-24">Score</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider w-32">Progress</th>
                                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider w-32">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {sortedMembers.map((member, idx) => {
                                                    const perf = member.perf;
                                                    const mdaRank = idx + 1;

                                                    return (
                                                        <tr
                                                            key={idx}
                                                            className={`group transition-colors ${perf && onRowClick
                                                                ? 'cursor-pointer hover:bg-[#006B3F]/5'
                                                                : 'hover:bg-gray-50'
                                                                }`}
                                                            onClick={() => perf && onRowClick?.(perf)}
                                                        >
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {perf ? (
                                                                    <span className={`text-sm font-medium ${mdaRank <= 3 ? "text-[#006B3F]" : "text-gray-500"
                                                                        }`}>
                                                                        #{mdaRank}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-300">-</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm font-medium text-gray-900 group-hover:text-[#006B3F] transition-colors">
                                                                    {member.name}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {perf ? (
                                                                    <span className="text-sm font-bold text-gray-900">
                                                                        {formatScore(perf.score)}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">No Data</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                {perf && (
                                                                    <ProgressBar score={perf.score} color={perf.status.color} showLabel={false} size="sm" />
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {perf && <StatusBadge status={perf.status} size="sm" />}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
