import { Button } from "../ui";
import styles from "./CueEditor.module.css";

type TimeAdjustmentProps = {
  onShift: (offsetMs: number) => void;
};

export const TimeAdjustment = ({ onShift }: TimeAdjustmentProps) => {
  return (
    <div className={styles.timeAdjustment}>
      <Button variant="ghost" size="sm" onClick={() => onShift(-1000)}>
        -1s
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onShift(-100)}>
        -0.1s
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onShift(100)}>
        +0.1s
      </Button>
      <Button variant="ghost" size="sm" onClick={() => onShift(1000)}>
        +1s
      </Button>
    </div>
  );
};
