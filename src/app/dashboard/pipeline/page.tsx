// src/app/dashboard/pipeline/page.tsx
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Film,
  Layers,
  RotateCw,
  Cpu,
} from 'lucide-react';
import { pipelineApi } from '@/lib/api/client';
import { Header } from '@/components/layout/header';
import { DetailSkeleton } from '@/components/common/skeleton';
import { formatDateTimeWithTz } from '@/lib/utils';

export default function PipelinePage() {
  const { data: pipeline, isLoading, isError, refetch } = useQuery({
    queryKey: ['pipelineHealth'],
    queryFn: () => pipelineApi.getPipelineHealth(),
    refetchInterval: 15000,
    retry: 1,
  });

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title="Video Pipeline Health"
        subtitle="Monitor video transcoding, HLS stream conversion, and media worker queue status."
      />

      <main className="p-6 sm:p-8 space-y-6 max-w-7xl">
        {isLoading ? (
          <DetailSkeleton />
        ) : isError || !pipeline ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-[#EDE4E1] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#231817]">Telemetry Currently Unavailable</h3>
            <p className="text-xs text-[#786665] max-w-md mx-auto">
              The video processing telemetry route could not be reached on the backend server.
            </p>
            <button
              onClick={() => refetch()}
              className="px-5 py-2.5 rounded-full bg-[#FF644E] text-white text-xs font-bold shadow-md shadow-[#FF644E]/20 hover:bg-[#F04730] transition-all"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Health Status Banner */}
            <div
              className={`p-6 rounded-3xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${
                pipeline.healthy
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/70 border-rose-200 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    pipeline.healthy ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  }`}
                >
                  {pipeline.healthy ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg">
                    {pipeline.healthy
                      ? 'Transcoding Pipeline Operational'
                      : 'Attention Required on Media Transcoder'}
                  </h3>
                  <p className="text-xs opacity-85 mt-0.5">
                    HLS stream packaging is {pipeline.hlsEnabled ? 'ENABLED' : 'DISABLED'} • Generated at{' '}
                    {formatDateTimeWithTz(pipeline.generatedAt)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => refetch()}
                className="px-4 py-2 rounded-full bg-white border border-[#EDE4E1] hover:border-[#FFB1A2] text-xs font-bold text-[#231817] shadow-xs transition-all flex items-center gap-1.5 shrink-0"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Refresh Telemetry
              </button>
            </div>

            {/* Video File Status Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-[#EDE4E1] text-center shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#786665]">
                  Ready (HLS)
                </span>
                <div className="font-impact text-2xl text-emerald-600 mt-1">
                  {pipeline.files.byStatus.ready}
                </div>
                <span className="text-[10px] text-[#9A8785]">Streamable</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#EDE4E1] text-center shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#786665]">
                  Processing
                </span>
                <div className="font-impact text-2xl text-blue-600 mt-1">
                  {pipeline.files.byStatus.processing}
                </div>
                <span className="text-[10px] text-[#9A8785]">Active encode</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#EDE4E1] text-center shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#786665]">
                  Pending Queue
                </span>
                <div className="font-impact text-2xl text-amber-600 mt-1">
                  {pipeline.files.byStatus.pending}
                </div>
                <span className="text-[10px] text-[#9A8785]">Waiting worker</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#EDE4E1] text-center shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#786665]">
                  Failed
                </span>
                <div className="font-impact text-2xl text-rose-600 mt-1">
                  {pipeline.files.byStatus.failed}
                </div>
                <span className="text-[10px] text-[#9A8785]">Errors logged</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#EDE4E1] text-center shadow-xs col-span-2 sm:col-span-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#786665]">
                  Legacy Raw
                </span>
                <div className="font-impact text-2xl text-[#231817] mt-1">
                  {pipeline.files.legacyRemaining}
                </div>
                <span className="text-[10px] text-[#9A8785]">Direct play</span>
              </div>
            </div>

            {/* Worker & Pipeline Age Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-white rounded-3xl border border-[#EDE4E1] shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#FF644E]" />
                  <h4 className="font-bold text-sm text-[#231817]">Queue &amp; Latency Metrics</h4>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-[#FAF7F5]">
                    <span className="text-[#786665]">Oldest Pending Age:</span>
                    <span className="font-bold text-[#231817]">
                      {pipeline.pipeline.oldestPendingAgeSec ? `${pipeline.pipeline.oldestPendingAgeSec}s` : '0s'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#FAF7F5]">
                    <span className="text-[#786665]">Jobs Pending &gt; 10 Minutes:</span>
                    <span className="font-bold text-emerald-600">
                      {pipeline.pipeline.pendingOverTenMinutes}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#786665]">Legacy Queue Remaining:</span>
                    <span className="font-bold text-[#231817]">
                      {pipeline.pipeline.legacyPending}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white rounded-3xl border border-[#EDE4E1] shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <Film className="w-5 h-5 text-[#F5A623]" />
                  <h4 className="font-bold text-sm text-[#231817]">Codec Specifications</h4>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-[#FAF7F5]">
                    <span className="text-[#786665]">Primary Format:</span>
                    <span className="font-bold text-[#231817]">HLS (HTTP Live Streaming, .m3u8)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#FAF7F5]">
                    <span className="text-[#786665]">Client Fallback:</span>
                    <span className="font-bold text-[#231817]">MP4 Direct Play</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-[#786665]">Adaptive Bitrates:</span>
                    <span className="font-bold text-emerald-600">1080p, 720p, 480p, 360p</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
