import * as Resizable from "react-resizable-panels";

import { Panel } from "../ui/panel";

const PanelProps: Record<string, Resizable.PanelProps> = {
  Menu: {
    defaultSize: 28,
    minSize: 28,
    maxSize: 28,
    disabled: true,
  },
  Content: {
    minSize: 200,
    defaultSize: 400,
  },
  Timeline: {
    defaultSize: 100,
    minSize: 200,
    maxSize: 350,
  },
  ContentExplorer: {
    defaultSize: 200,
    minSize: 400,
  },
  Canvas: {
    defaultSize: 700,
    minSize: 700,
  },
  Editor: {
    defaultSize: 200,
    minSize: 400,
  },
};

export const SubtitleEditor = () => {
  return (
    <Resizable.Group
      orientation="vertical"
      className="h-screen! p-2 gap-2 bg-neutral-950 text-stone-100"
    >
      {/* Menu */}
      <Panel as={Resizable.Panel} {...PanelProps.Menu}>
        <h1 className="text-xl font-bold">Subtitle Editor</h1>
      </Panel>

      {/* Content - Canvas - Editor */}
      <Resizable.Panel {...PanelProps.Content}>
        <Resizable.Group className="h-full gap-2">
          {/* Content */}
          <Panel as={Resizable.Panel} {...PanelProps.ContentExplorer}>
            <h2 className="text-lg font-semibold">Canvas</h2>
          </Panel>

          {/* Canvas */}
          <Panel as={Resizable.Panel} {...PanelProps.Canvas}>
            <h2 className="text-lg font-semibold">Canvas</h2>
          </Panel>

          {/* Editor */}
          <Panel as={Resizable.Panel} {...PanelProps.Editor}>
            <h2 className="text-lg font-semibold">Editor</h2>
          </Panel>
        </Resizable.Group>
      </Resizable.Panel>

      {/* Timeline */}
      <Panel as={Resizable.Panel} {...PanelProps.Timeline}>
        <h2 className="text-lg font-semibold">Timeline</h2>
      </Panel>
    </Resizable.Group>
  );
};
