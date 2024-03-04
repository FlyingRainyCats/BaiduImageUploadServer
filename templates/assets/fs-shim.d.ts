type RawHandle = FileSystemDirectoryHandle | FileSystemFileHandle | FileSystemDirectoryEntry | FileSystemFileEntry;

declare abstract class FsObject {
  handle: RawHandle;
  name: string;

  constructor(handleOrEntry: RawHandle, name: string);

  abstract readonly isDirectory: boolean;
  abstract readonly isFile: boolean;

  abstract listFiles(): Promise<FsObject[]>;

  abstract toFile(): Promise<File>;

  static create(handle: RawHandle, name?: string): FsObject;
}
