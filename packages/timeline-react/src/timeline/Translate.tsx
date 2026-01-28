import { useTimelineTranslate } from "./useViewport.ts";

type TranslateProps = React.ComponentProps<"div">;
export const Translate = ({ children, style, ...rest }: TranslateProps) => {
  const translatePx = useTimelineTranslate();
  return (
    <div style={{ ...style, translate: -translatePx }} {...rest}>
      {children}
    </div>
  );
};
