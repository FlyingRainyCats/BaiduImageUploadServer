;(() => {
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
                return tag(Object.assign({children}, attrs));
            }

            var el = merge(document.createElement(tag), attrs);
            return appendChildren(el, children);
        }

        h.Fragment = function Fragment({children}) {
            return appendChildren(document.createDocumentFragment(), children);
        };

        return h;
    })();

    function UploadedUrlItem({url}) {
        return h('li', {className: 'uploaded-images--item'},
            h('a', {
                    className: 'uploaded-images--preview',
                    target: '_blank',
                    referrerPolicy: 'no-referrer',
                    rel: 'noopener noreferrer nofollow'
                },
                h('img', {
                    crossOrigin: 'anonymous',
                    alt: '点击重试加载',
                    className: 'uploaded-images--image',
                    src: url,
                }),
            ),
            h('div', {className: 'uploaded-images--fields'},
                h('input', {
                    className: 'uploaded-images--field',
                    type: 'text',
                    readOnly: true,
                    value: url
                }),
                h('input', {
                    className: 'uploaded-images--field',
                    type: 'text',
                    readOnly: true,
                    value: `![](${url})`
                }),
                h('input', {
                    className: 'uploaded-images--field',
                    type: 'text',
                    readOnly: true,
                    value: `[img]${url}[/img]`
                })
            )
        )
    }

    const $formUpload = document.getElementById('image-upload');
    const $imageContainer = document.getElementById('uploaded-images');

    async function uploadImage(formData) {
        const resp = await fetch('/upload', {
            method: 'POST',
            body: formData,
        }).then(r => r.json());

        for (const url of resp.urls) {
            const el = UploadedUrlItem({url});
            $imageContainer.appendChild(el);
        }
    }

    $formUpload.addEventListener('submit', (e) => {
        e.preventDefault();

        let formData = new FormData(e.target);
        uploadImage(formData).catch(alert);
    });

    document.body.addEventListener('click', (e) => {
        const field = e.target.closest('.uploaded-images--field');
        if (field) {
            field.select();
        }

        const image = e.target.closest('.uploaded-images--image');
        if (image && !image.loaded) {
            if (image.naturalWidth === 0) {
                image.src = `${image.src.replace(/\?.+$/, '')}?ts=${Date.now()}`;
            }
        }
    });
})();