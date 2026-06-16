import { useStore } from "@ptl/store/react";
import type {
  DockToolWindowComponentProps,
  DockWorkspaceItemComponentProps,
} from "@ptl/dock-react";

import { useEditorDockServices } from "./editor-services-context";

/**
 * Render the active subtitle document as a compact cue table.
 *
 * @param props - Workspace item metadata supplied by the dock.
 * @returns Table view for the current timed-text document.
 *
 * @example
 * ```tsx
 * <SubtitleDocumentPane item={workspaceItem} />
 * ```
 */
export function SubtitleDocumentPane({ item }: DockWorkspaceItemComponentProps) {
  const { documents } = useEditorDockServices();
  const document = useStore(documents.getDocumentStore());
  const cueCount = document?.tracks.reduce((total, track) => total + track.cues.length, 0) ?? 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b px-3 py-2">
        <div className="text-sm font-medium">{item.title}</div>
        <div className="text-xs text-muted-foreground">
          {(document?.format ?? "vtt").toUpperCase()} · {cueCount} cue
          {cueCount === 1 ? "" : "s"}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-background text-muted-foreground">
            <tr className="border-b">
              <th className="w-24 px-3 py-2 font-medium">Start</th>
              <th className="w-24 px-3 py-2 font-medium">End</th>
              <th className="px-3 py-2 font-medium">Text</th>
            </tr>
          </thead>
          <tbody>
            {document?.tracks.flatMap((track) =>
              track.cues.map((cue) => (
                <tr key={cue.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2 tabular-nums">{formatMs(cue.startMs)}</td>
                  <td className="px-3 py-2 tabular-nums">{formatMs(cue.endMs)}</td>
                  <td className="px-3 py-2">{cue.text || <span className="text-muted-foreground">Empty cue</span>}</td>
                </tr>
              )),
            )}
            {cueCount === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-10 text-center text-muted-foreground">
                  No cues yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Render a document outline grouped by subtitle track.
 *
 * @param _props - Tool-window props reserved for future panel integrations.
 * @returns Outline content for the current document.
 */
export function OutlineToolWindow(_props: DockToolWindowComponentProps) {
  const { documents } = useEditorDockServices();
  const document = useStore(documents.getDocumentStore());

  return (
    <div className="space-y-2 text-xs">
      {(document?.tracks ?? []).map((track) => (
        <div key={track.id}>
          <div className="font-medium">{track.id}</div>
          <div className="text-muted-foreground">
            {track.kind} · {track.cues.length} cue{track.cues.length === 1 ? "" : "s"}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Render subtitle track summaries with cue counts and durations.
 *
 * @param _props - Tool-window props reserved for future panel integrations.
 * @returns Track summary list for the current document.
 */
export function TracksToolWindow(_props: DockToolWindowComponentProps) {
  const { documents } = useEditorDockServices();
  const document = useStore(documents.getDocumentStore());

  return (
    <div className="space-y-2 text-xs">
      {(document?.tracks ?? []).map((track) => {
        const durationMs = track.cues.reduce(
          (maxEnd, cue) => Math.max(maxEnd, cue.endMs),
          0,
        );

        return (
          <div key={track.id} className="rounded border px-2 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{track.id}</span>
              <span className="text-muted-foreground">{track.kind}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-muted-foreground">
              <span>
                {track.cues.length} cue{track.cues.length === 1 ? "" : "s"}
              </span>
              <span className="tabular-nums">{formatMs(durationMs)}</span>
            </div>
          </div>
        );
      })}
      {(document?.tracks.length ?? 0) === 0 ? (
        <div className="text-muted-foreground">No tracks.</div>
      ) : null}
    </div>
  );
}

/**
 * Render details for the current editor selection.
 *
 * @param _props - Tool-window props reserved for future panel integrations.
 * @returns Selection details for the inspector panel.
 */
export function InspectorToolWindow(_props: DockToolWindowComponentProps) {
  const { selection } = useEditorDockServices();
  const selected = useStore(selection.getStore());

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-xs">
      <dt className="text-muted-foreground">Kind</dt>
      <dd>{selected.kind}</dd>
      <dt className="text-muted-foreground">Track</dt>
      <dd>{"trackId" in selected ? selected.trackId : "-"}</dd>
      <dt className="text-muted-foreground">Cues</dt>
      <dd>{"cueIds" in selected ? selected.cueIds.join(", ") : "-"}</dd>
    </dl>
  );
}

/**
 * Render lightweight subtitle quality checks.
 *
 * @param _props - Tool-window props reserved for future panel integrations.
 * @returns Quality check summary for the current document.
 */
export function QualityToolWindow(_props: DockToolWindowComponentProps) {
  const { documents } = useEditorDockServices();
  const document = useStore(documents.getDocumentStore());
  const emptyCueCount =
    document?.tracks.reduce(
      (total, track) => total + track.cues.filter((cue) => cue.text.trim().length === 0).length,
      0,
    ) ?? 0;

  return (
    <div className="text-xs">
      <div className="font-medium">Quality checks</div>
      <div className="mt-2 text-muted-foreground">
        {emptyCueCount === 0 ? "No obvious text issues." : `${emptyCueCount} empty cue(s).`}
      </div>
    </div>
  );
}

/**
 * Render playback status, current time, and rate.
 *
 * @param _props - Tool-window props reserved for future panel integrations.
 * @returns Playback diagnostics for the current session.
 */
export function PlaybackToolWindow(_props: DockToolWindowComponentProps) {
  const { playback } = useEditorDockServices();
  const state = useStore(playback.getStore());

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Status</span>
        <span>{state.status}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Time</span>
        <span className="tabular-nums">{formatMs(state.currentTimeMs)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Rate</span>
        <span>{state.playbackRate}x</span>
      </div>
    </div>
  );
}

/**
 * Render a compact timeline with cue blocks and the playback playhead.
 *
 * @param _props - Tool-window props reserved for future panel integrations.
 * @returns Timeline visualization for the current subtitle document.
 */
export function TimelineToolWindow(_props: DockToolWindowComponentProps) {
  const { documents, playback } = useEditorDockServices();
  const document = useStore(documents.getDocumentStore());
  const playbackState = useStore(playback.getStore());
  const durationMs = Math.max(playbackState.durationMs ?? 1, 1);
  const playheadPercent = Math.min(100, (playbackState.currentTimeMs / durationMs) * 100);
  const cues = document?.tracks.flatMap((track) => track.cues) ?? [];

  return (
    <div className="relative h-full min-h-20 overflow-hidden text-xs">
      <div className="absolute inset-x-0 top-5 h-px bg-border" />
      <div
        className="absolute top-1 h-12 w-px bg-primary"
        style={{ left: `${playheadPercent}%` }}
      />
      {cues.map((cue) => {
        const left = Math.min(100, (cue.startMs / durationMs) * 100);
        const width = Math.max(1, ((cue.endMs - cue.startMs) / durationMs) * 100);

        return (
          <div
            key={cue.id}
            className="absolute top-8 h-6 rounded-sm border bg-secondary px-1 leading-6 text-secondary-foreground"
            style={{ left: `${left}%`, width: `${width}%` }}
            title={cue.text}
          >
            {cue.text || cue.id}
          </div>
        );
      })}
      {cues.length === 0 ? (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          Timeline is ready for cues.
        </div>
      ) : null}
    </div>
  );
}

/**
 * Format milliseconds as a subtitle-friendly timestamp.
 *
 * @param value - Milliseconds to format.
 * @returns Timestamp in `m:ss.SSS` form.
 *
 * @example
 * ```ts
 * formatMs(61500); // "1:01.500"
 * ```
 */
function formatMs(value: number) {
  const totalSeconds = Math.floor(value / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = value % 1_000;

  return `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds
    .toString()
    .padStart(3, "0")}`;
}
