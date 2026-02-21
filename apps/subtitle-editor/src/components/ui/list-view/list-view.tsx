import { useVirtualizer } from "@tanstack/react-virtual";
import clsx from "clsx";
import React from "react";

type ListViewContextType = {
  virtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>;
};

const ListViewContext = React.createContext<ListViewContextType | null>(null);

const useListView = () => {
  const ctx = React.useContext(ListViewContext);
  if (!ctx) {
    throw new Error("ListView.Item must be used within a ListView.Root");
  }
  return ctx;
};

type ListViewRootProps = {
  count: number;
  activeIndex?: number;
  estimateSize?: number;
  overscan?: number;
  className?: string;
  children: React.ReactNode;
};

const ListViewRoot = ({
  count,
  activeIndex = -1,
  estimateSize = 72,
  overscan = 5,
  className,
  children,
}: ListViewRootProps) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  const prevActiveIndexRef = React.useRef<number>(-1);
  React.useEffect(() => {
    if (activeIndex < 0 || activeIndex >= count) return;
    if (prevActiveIndexRef.current === activeIndex) return;
    prevActiveIndexRef.current = activeIndex;
    virtualizer.scrollToIndex(activeIndex, {
      align: "auto",
      behavior: "smooth",
    });
  }, [activeIndex, count, virtualizer]);

  const ctx = { virtualizer };

  return (
    <ListViewContext.Provider value={ctx}>
      <div
        ref={scrollRef}
        className={clsx("flex-1 overflow-y-auto", className)}
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            width: "100%",
            position: "relative",
          }}
        >
          {children}
        </div>
      </div>
    </ListViewContext.Provider>
  );
};

type ListViewItemsProps<TData> = {
  data: readonly TData[];
  getItemKey?: (item: TData, index: number) => string | number;
  children: (item: TData, index: number) => React.ReactNode;
};

const ListViewItems = <TData,>({
  data,
  getItemKey,
  children,
}: ListViewItemsProps<TData>) => {
  const { virtualizer } = useListView();

  return virtualizer.getVirtualItems().map((virtualRow) => {
    const item = data[virtualRow.index];
    const key = getItemKey
      ? getItemKey(item, virtualRow.index)
      : virtualRow.index;

    return (
      <div
        key={key}
        ref={virtualizer.measureElement}
        data-index={virtualRow.index}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          transform: `translateY(${virtualRow.start}px)`,
        }}
      >
        {children(item, virtualRow.index)}
      </div>
    );
  });
};

export const ListView = {
  Root: ListViewRoot,
  Items: ListViewItems,
};
