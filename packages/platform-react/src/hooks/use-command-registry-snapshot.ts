import type { CommandDefinition, CommandExecutor } from "@ptl/platform-core";
import * as React from "react";

export function useCommandSnapshot(commands: CommandExecutor): readonly CommandDefinition<unknown, unknown>[] {
  const [snapshot, setSnapshot] = React.useState(() => commands.getAll());
  React.useEffect(() => commands.subscribe(setSnapshot).dispose, [commands]);
  return snapshot;
}
