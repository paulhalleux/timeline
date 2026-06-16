import { MenuBar } from "@ptl/platform-react";
import type { SubtitleCommandContext } from "@ptl/subtitle-core";

export const AppMenubar = ({ context }: { context: SubtitleCommandContext }) => (
  <MenuBar
    className="h-8 w-full border-b! rounded-none!"
    contentClassName="w-52"
    context={context}
    leading={<div className="px-2 text-xs font-semibold text-muted-foreground">ST</div>}
    menu="main"
  />
);
