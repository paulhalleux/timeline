import React from "react";

import type { ColumnDef } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";

type DataTableProps<TData> = {
  data: readonly TData[];
  columns: ColumnDef<TData, unknown>[];
  activeRowIndex?: number;
  onRowClick?: (row: TData, index: number) => void;
  isRowActive?: (row: TData, index: number) => boolean;
  rowHeight?: number;
  estimateSize?: number;
  overscan?: number;
  meta?: Record<string, unknown>;
  className?: string;
};

export const DataTable = <TData,>({
  data,
  columns,
  activeRowIndex = -1,
  onRowClick,
  isRowActive,
  rowHeight,
  estimateSize = 36,
  overscan = 5,
  meta,
  className,
}: DataTableProps<TData>) => {
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data as TData[],
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta,
  });

  const { rows } = table.getRowModel();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const effectiveEstimate = rowHeight ?? estimateSize;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => effectiveEstimate,
    overscan,
  });

  const prevActiveIndexRef = React.useRef<number>(-1);
  React.useEffect(() => {
    if (activeRowIndex < 0 || activeRowIndex >= rows.length) return;
    if (prevActiveIndexRef.current === activeRowIndex) return;
    prevActiveIndexRef.current = activeRowIndex;
    virtualizer.scrollToIndex(activeRowIndex, {
      align: "auto",
      behavior: "smooth",
    });
  }, [activeRowIndex, rows.length, virtualizer]);

  const totalColumnWidth = React.useMemo(() => {
    return table.getFlatHeaders().reduce((sum, h) => sum + h.getSize(), 0);
  }, [table]);

  const colgroup = (
    <colgroup>
      {table.getFlatHeaders().map((header) => (
        <col key={header.id} style={{ width: header.getSize() }} />
      ))}
    </colgroup>
  );

  return (
    <div ref={scrollRef} className={clsx("overflow-auto flex-1", className)}>
      <table
        className="border-collapse text-xs"
        style={{ tableLayout: "fixed", minWidth: totalColumnWidth }}
      >
        {colgroup}
        <thead className="sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-neutral-900">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="text-left font-medium text-neutral-400 px-2 py-1.5 border-b border-neutral-700 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {/* Spacer row before visible items */}
          {virtualizer.getVirtualItems().length > 0 && (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  height: virtualizer.getVirtualItems()[0].start,
                  padding: 0,
                  border: "none",
                }}
              />
            </tr>
          )}
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            const active = isRowActive
              ? isRowActive(row.original, virtualRow.index)
              : false;
            return (
              <tr
                key={row.id}
                ref={
                  rowHeight === undefined
                    ? virtualizer.measureElement
                    : undefined
                }
                data-index={virtualRow.index}
                onClick={() => onRowClick?.(row.original, virtualRow.index)}
                className={clsx(
                  "border-b border-neutral-800/60 transition-colors",
                  onRowClick && "cursor-pointer hover:bg-neutral-800/50",
                  active && "bg-cyan-950/40",
                )}
                style={{ height: rowHeight }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-2 py-1.5 text-neutral-200 overflow-hidden text-ellipsis whitespace-nowrap"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
          {/* Spacer row after visible items */}
          {virtualizer.getVirtualItems().length > 0 && (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  height:
                    virtualizer.getTotalSize() -
                    (virtualizer.getVirtualItems().at(-1)?.end ?? 0),
                  padding: 0,
                  border: "none",
                }}
              />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
