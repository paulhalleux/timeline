import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Menubar as BaseMenubar } from "@base-ui/react/menubar";
import clsx from "clsx";
import { ChevronRightIcon } from "lucide-react";

export const MenubarRoot = ({
  className,
  children,
  ...rest
}: BaseMenubar.Props) => {
  return (
    <BaseMenubar
      className={clsx("h-full w-full flex items-center gap-1 p-0.5", className)}
      {...rest}
    >
      {children}
    </BaseMenubar>
  );
};

export const MenuTrigger = ({
  className,
  children,
  ...rest
}: BaseMenu.Trigger.Props) => {
  return (
    <BaseMenu.Trigger
      className={clsx(
        "text-xs font-medium hover:bg-neutral-800 rounded-xs h-full px-1",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent",
        "focus:outline-none",
        className,
      )}
      {...rest}
    >
      {children}
    </BaseMenu.Trigger>
  );
};

export const MenuRoot = (props: BaseMenu.Root.Props) => {
  return <BaseMenu.Root {...props} />;
};

export const MenuContent = ({
  children,
  className,
  ...rest
}: BaseMenu.Popup.Props) => {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner>
        <BaseMenu.Popup
          className={clsx(
            "text-gray-100",
            "rounded flex flex-col gap-0.5 p-0.5 bg-neutral-900 border border-neutral-800",
            "focus:outline-none",
            "shadow-lg",
            className,
          )}
          {...rest}
        >
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
};

export const MenuGroup = ({
  children,
  className,
  ...rest
}: BaseMenu.Group.Props) => {
  return (
    <BaseMenu.Group
      className={clsx("flex flex-col gap-0.5", className)}
      {...rest}
    >
      {children}
    </BaseMenu.Group>
  );
};

export const MenuGroupLabel = ({
  children,
  className,
  ...rest
}: BaseMenu.GroupLabel.Props) => {
  return (
    <BaseMenu.GroupLabel
      className={clsx(
        "flex items-center gap-1.5",
        "text-xs text-gray-400 px-1.5 py-1",
        "select-none",
        className,
      )}
      {...rest}
    >
      {children}
    </BaseMenu.GroupLabel>
  );
};

export const MenuItem = ({
  children,
  className,
  ...rest
}: BaseMenu.Item.Props) => {
  return (
    <BaseMenu.Item
      className={clsx(
        "flex items-center gap-1.5",
        "text-xs  rounded-xs px-1.5 py-1 cursor-pointer",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent",
        "focus:outline-none  data-highlighted:bg-neutral-800",
        className,
      )}
      {...rest}
    >
      {children}
    </BaseMenu.Item>
  );
};

export const SubmenuRoot = (props: BaseMenu.SubmenuRoot.Props) => {
  return <BaseMenu.SubmenuRoot {...props} />;
};

export const SubmenuTrigger = ({
  children,
  className,
  ...rest
}: BaseMenu.SubmenuTrigger.Props) => {
  return (
    <BaseMenu.SubmenuTrigger
      className={clsx(
        "flex items-center justify-between gap-1.5",
        "text-xs rounded-xs px-1.5 py-1 cursor-pointer",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent",
        "focus:outline-none data-highlighted:bg-neutral-800",
        className,
      )}
      {...rest}
    >
      {children}
      <ChevronRightIcon size={15} className="text-neutral-500 ml-auto" />
    </BaseMenu.SubmenuTrigger>
  );
};

export const SubmenuContent = ({
  children,
  className,
  ...rest
}: BaseMenu.Popup.Props) => {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner sideOffset={-4}>
        <BaseMenu.Popup
          className={clsx(
            "text-gray-100",
            "rounded flex flex-col gap-0.5 p-0.5 bg-neutral-900 border border-neutral-800",
            "focus:outline-none",
            "shadow-lg",
            className,
          )}
          {...rest}
        >
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
};
