(() => {
  // https://web.dev/patterns/files/drag-and-drop-directories
  const supportsFileSystemAccessAPI = 'getAsFileSystemHandle' in DataTransferItem.prototype;
  const supportsWebkitGetAsEntry = 'webkitGetAsEntry' in DataTransferItem.prototype;
  const supportsDirectoryUpload = supportsWebkitGetAsEntry || supportsFileSystemAccessAPI;

  // nano id: https://github.com/ai/nanoid/blob/5.0.6/non-secure/index.js
  const NANOID_CHAR_TABLE = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';
  const nanoid = (size = 21, id = '') => {
    for (let i = size; i-- > 0; ) {
      id += NANOID_CHAR_TABLE[(Math.random() * 64) | 0];
    }
    return id;
  };

  var h = (function () {
    function deref(fn) {
      return Function.call.bind(fn);
    }

    var slice = deref(Array.prototype.slice);

    // Lodash code starts here
    var MAX_SAFE_INTEGER = 9007199254740991;

    function isLength(value) {
      return typeof value == 'number' && value > -1 && value % 1 === 0 && value <= MAX_SAFE_INTEGER;
    }

    function isArrayLike(value) {
      return value != null && isLength(value.length) && !isFunction(value);
    }

    function isObjectLike(value) {
      return value != null && typeof value == 'object';
    }

    // Lodash code ends here

    function isFunction(value) {
      return value instanceof Function;
    }

    function makeArray(v) {
      return isArrayLike(v) && typeof v !== 'string' ? slice(v) : [v];
    }

    function isNode(el) {
      return el instanceof Node;
    }

    function isObjectLikeNotArray(value) {
      return isObjectLike(value) && !isArrayLike(value);
    }

    function merge(src) {
      slice(arguments, 1).forEach(function (ext) {
        if (isObjectLikeNotArray(ext)) {
          Object.keys(ext).forEach(function (key) {
            var value = ext[key];
            if (isObjectLikeNotArray(value)) {
              if (!src[key]) {
                src[key] = {};
              }
              merge(src[key], value);
            } else {
              src[key] = value;
            }
          });
        }
      });

      return src;
    }

    function appendChildren(container, children) {
      children.forEach(function (children) {
        makeArray(children).forEach(function (child) {
          if (child || child === '') {
            container.appendChild(isNode(child) ? child : document.createTextNode(child));
          }
        });
      });
      return container;
    }

    function h(tag, attrs) {
      var children = slice(arguments, 2);

      // Stateless 组件建立
      if (isFunction(tag)) {
        return tag(Object.assign({ children }, attrs));
      }

      var el = merge(document.createElement(tag), attrs);
      return appendChildren(el, children);
    }

    h.Fragment = function Fragment({ children }) {
      return appendChildren(document.createDocumentFragment(), children);
    };

    return h;
  })();

  function CopyFieldInput({ label, value }) {
    return h(
      'label',
      {
        className: 'uploaded-images--label',
      },
      h(
        'span',
        {
          className: 'uploaded-images--label-text',
        },
        label,
      ),
      h('input', {
        className: 'uploaded-images--field',
        type: 'text',
        readOnly: true,
        value,
      }),
    );
  }

  function UploadedUrlFields({ url }) {
    return h(
      'div',
      { className: 'uploaded-images--fields' },
      h(CopyFieldInput, { label: 'URL', value: url }),
      h(CopyFieldInput, { label: 'Markdown', value: `![](${url})` }),
      h(CopyFieldInput, { label: 'BBCode', value: `[img]${url}[/img]` }),
    );
  }

  function UploadError({ error }) {
    return h(
      'div',
      { className: 'uploaded-images--error' },
      h('p', { className: 'uploaded-images--error-message' }, String(error)),
    );
  }

  function UploadedUrlItem({ id, url, uploadUrl, error, uploading }) {
    return h(
      'li',
      {
        id,
        className:
          'uploaded-images--item' +
          (uploading ? ' uploaded-images--uploading' : '') +
          (error ? ' uploaded-images--error' : ''),
      },
      h(
        'a',
        {
          className: 'uploaded-images--preview',
          href: uploadUrl ?? '',
          target: '_blank',
          referrerPolicy: 'no-referrer',
          rel: 'noopener noreferrer nofollow',
        },
        h('img', {
          crossOrigin: 'anonymous',
          className: 'uploaded-images--image',
          src: url,
        }),
      ),
      uploadUrl && h(UploadedUrlFields, { url: uploadUrl }),
      error && h(UploadError, { error }),
    );
  }

  const $ = (id) => document.getElementById(id);

  const $imageContainer = $('uploaded-images');
  /**
   * @type {HTMLInputElement}
   */
  const $imageInput = $('image-input');
  const $bduss = $('bduss');
  const $csrf = $('csrf-token');

  async function fileToImageUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = function () {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Upload a single image.
   * @param {File} image
   * @returns {Promise<void>}
   */
  async function uploadImage(image) {
    let formData = new FormData();
    formData.append('image', image);
    formData.append('bduss', $bduss.value);
    formData.append('_csrf', $csrf.value);

    const resp = await fetch('/upload', {
      method: 'POST',
      body: formData,
    }).then((r) => {
      if (r.status !== 200) {
        throw new Error(`upload failed with status code: ${r.status}`);
      }
      return r.json();
    });
    return resp.urls[0];
  }

  /**
   * Upload a single image and return a function that can be used to start the upload.
   * @param {File} image
   * @return {Promise<() => Promise<void>>}
   */
  async function uploadSingleImage(image) {
    const id = `${nanoid()}-${Date.now()}`;
    const imageUrl = await fileToImageUrl(image);
    $imageContainer.appendChild(h(UploadedUrlItem, { id, url: imageUrl, uploading: true }));
    return async () => {
      try {
        // DEBUG: set this value to true to disable upload
        if (window._no_upload) {
          // noinspection ExceptionCaughtLocallyJS
          throw new Error('upload disabled');
        }

        const url = await uploadImage(image);
        $(id).replaceWith(h(UploadedUrlItem, { id, url: imageUrl, uploadUrl: url }));
      } catch (error) {
        $(id).replaceWith(h(UploadedUrlItem, { id, url: imageUrl, error }));
      }
    };
  }

  /**
   * @param {File[]} images
   * @returns {Promise<void>}
   */
  async function uploadAllImages(images) {
    if (images.length === 0) {
      return;
    }

    const uploadQueue = [];
    for (const image of images) {
      uploadQueue.push(await uploadSingleImage(image));
    }
    for (const promise of uploadQueue) {
      await promise();
    }
  }

  /**
   * @param {(() => Promise<void>)[]} queue
   * @param {FsObject} fsObj
   */
  async function handleFsObjectUpload(queue, fsObj) {
    if (fsObj.isFile) {
      queue.push(await uploadSingleImage(await fsObj.toFile()));
      return;
    }

    if (fsObj.isDirectory) {
      for (const nextFsObj of await fsObj.listFiles()) {
        await handleFsObjectUpload(queue, nextFsObj);
      }
    }
  }

  /**
   * @param {FileList|File[]} files
   * @returns {unknown[]}
   */
  const filterImages = (files) => Array.from(files).filter((x) => x.type.startsWith('image/'));

  $imageInput.onchange = () => {
    uploadAllImages(filterImages($imageInput.files)).catch(console.error);
    setTimeout(() => {
      $imageInput.value = '';
    });
  };

  document.body.addEventListener('click', (e) => {
    const field = e.target.closest('.uploaded-images--field');
    if (field) {
      field.select();
    }

    const imagePreviewLink = e.target.closest('.uploaded-images--preview');
    if (imagePreviewLink && !imagePreviewLink.getAttribute('href')) {
      e.preventDefault();
    }
  });

  document.body.addEventListener('paste', (e) => {
    uploadAllImages(filterImages(e.clipboardData.files)).catch(console.error);
  });

  /**
   * @param {DataTransfer} dataTransfer
   */
  async function handleDataTransfer(dataTransfer) {
    if (supportsDirectoryUpload) {
      /** @type {(Promise<FsObject|null>)[]} */
      const fsObjPromises = [...dataTransfer.items].map((item) => {
        if (isImageTransferItem(item)) {
          // `getAsFileSystemHandle` is preferred API.
          const handlePromise = supportsFileSystemAccessAPI
            ? item.getAsFileSystemHandle()
            : Promise.resolve(item.webkitGetAsEntry());
          return handlePromise.then((handle) => FsObject.create(handle, 'root'));
        }

        return null;
      });

      /** @type {FsObject[]} */
      const fsObjects = (await Promise.all(fsObjPromises)).filter(Boolean);

      const uploadQueue = [];
      for (const fsObj of fsObjects) {
        await handleFsObjectUpload(uploadQueue, fsObj);
      }
      for (const upload of uploadQueue) {
        await upload();
      }
    } else {
      let files = dataTransfer.files;
      await uploadAllImages(filterImages(files));
    }
  }

  /**
   * @param {DataTransferItem} item
   * @return {boolean}
   */
  const isImageTransferItem = (item) => item.kind === 'file';

  let dndCounter = 0;
  const updateDndNotes = (e) => {
    const isDndFile = Array.prototype.some.call(e.dataTransfer.items, isImageTransferItem);
    e.dataTransfer.effectAllowed = isDndFile ? 'copy' : 'none';

    if (isDndFile) {
      e.preventDefault();
      document.body.classList.toggle('hide-dnd-notes', dndCounter === 0);
    }
  };
  document.body.addEventListener('dragenter', (e) => {
    dndCounter++;
    updateDndNotes(e);
  });
  document.body.addEventListener('dragover', (e) => {
    updateDndNotes(e);
  });
  document.body.addEventListener('dragleave', (e) => {
    dndCounter--;
    updateDndNotes(e);
  });

  document.body.addEventListener('drop', (e) => {
    dndCounter = 0;
    updateDndNotes(e);

    handleDataTransfer(e.dataTransfer).catch(console.error);
  });
})();
