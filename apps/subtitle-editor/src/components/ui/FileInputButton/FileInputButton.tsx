import * as React from "react";

import { Button } from "../Button/Button.tsx";

interface FileInputButtonProps {
  label: string;
  accept: string;
  icon?: React.ReactNode;
  onFileSelect: (file: File) => void;
}

export const FileInputButton: React.FC<FileInputButtonProps> = ({
  label,
  accept,
  icon,
  onFileSelect,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      // Reset input to allow selecting the same file again
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <>
      <Button
        variant="default"
        size="sm"
        iconStart={icon}
        onClick={handleClick}
      >
        {label}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        hidden
      />
    </>
  );
};
