export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export function filesToDataUrls(files: FileList | File[]): Promise<string[]> {
  return Promise.all(Array.from(files).map(fileToDataUrl));
}
