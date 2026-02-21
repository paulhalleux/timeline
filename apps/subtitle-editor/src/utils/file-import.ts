type FileImpotOptions = {
  accept?: string;
  multiple?: boolean;
  onFiles?: (files: File[]) => void;
};

/**
 * Triggers a file import dialog and calls the provided callback with the selected files.
 *
 * @param options - Options for file import, including accepted file types, multiple selection, and a callback for handling selected files.
 */
export const triggerFileImport = (options: FileImpotOptions) => {
  const input = document.createElement("input");
  input.type = "file";
  if (options.accept) {
    input.accept = options.accept;
  }
  if (options.multiple) {
    input.multiple = true;
  }
  input.onchange = () => {
    if (input.files) {
      const files = Array.from(input.files);
      options.onFiles?.(files);
    }
  };
  input.click();
};
