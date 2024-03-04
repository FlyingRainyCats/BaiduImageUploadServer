/**
 * @file
 * @desc A simple shim to get Handles & Entries (legacy API) work in a uniformed way.
 */

window.FsObject = (() => {
    /**
     * @typedef {FileSystemDirectoryEntry | FileSystemFileEntry | FileSystemDirectoryHandle | FileSystemFileHandle} RawHandle
     */

    class FsObject {
        /**
         * @param {RawHandle} handleOrEntry
         * @param {string} name
         */
        constructor(handleOrEntry, name) {
            this.handle = handleOrEntry;
            this.name = name;
        }

        /**
         * @return {boolean}
         */
        get isDirectory() {
            throw new Error('not implemented');
        }

        /**
         * @return {boolean}
         */
        get isFile() {
            throw new Error('not implemented');
        }

        /**
         * @returns {Promise<FsObject[]>}
         */
        async listFiles() {
            throw new Error('not implemented');
        }

        /**
         * @returns {Promise<File>}
         */
        async toFile() {
            throw new Error('not implemented');
        }

        /**
         * @param {RawHandle} handle
         * @param {string} [name]
         * @return {FsObject}
         */
        static create(handle, name = '$unknown') {
            if (handle instanceof FileSystemHandle) {
                return new FsObject$Handle(handle, name);
            } else if ('fullPath' in handle && typeof handle.fullPath === 'string') {
                return new FsObject$Entry(handle, name);
            } else {
                throw new Error('File System Access API is not supported');
            }
        }
    }

    class FsObject$Handle extends FsObject {
        get isDirectory() {
            return this.handle.kind === 'directory';
        }

        get isFile() {
            return this.handle.kind === 'file';
        }

        async listFiles() {
            const entries = await Array.fromAsync(this.handle.entries());
            return entries.map(([name, handle]) => FsObject.create(handle, name));
        }

        async toFile() {
            return this.handle.getFile();
        }
    }

    class FsObject$Entry extends FsObject {
        get isDirectory() {
            return this.handle.isDirectory;
        }

        get isFile() {
            return this.handle.isFile;
        }

        async listFiles() {
            const reader = this.handle.createReader();
            /** @type {FileSystemEntry[]} */
            const entries = await new Promise((resolve, reject) => {
                reader.readEntries(resolve, reject);
            });
            return entries.map(entry => FsObject.create(entry, entry.name));
        }

        async toFile() {
            return new Promise((resolve, reject) => {
                this.handle.file(resolve, reject);
            })
        }
    }

    return FsObject;
})();
