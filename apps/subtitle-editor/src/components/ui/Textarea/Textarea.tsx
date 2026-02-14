import React from "react";

import styles from "./Textarea.module.css";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea: React.FC<TextareaProps> = (props) => {
  return (
    <textarea
      className={styles.textArea}
      placeholder="Enter subtitle text..."
      rows={4}
      {...props}
    />
  );
};
