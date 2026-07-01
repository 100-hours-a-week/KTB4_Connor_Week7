import { resolveImageUrl } from "./image.js";

function createImagePreviewController({ image, fallback, onShow, onClear } = {}) {
    let objectUrl = "";

    function revoke() {
        if (!objectUrl) {
            return;
        }

        URL.revokeObjectURL(objectUrl);
        objectUrl = "";
    }

    function clear() {
        revoke();
        image?.removeAttribute("src");

        if (image) {
            image.hidden = true;
        }

        if (fallback) {
            fallback.hidden = false;
        }

        onClear?.();
    }

    function show(imageUrl) {
        const resolvedUrl = resolveImageUrl(imageUrl);

        if (!resolvedUrl) {
            clear();
            return;
        }

        if (image) {
            image.src = resolvedUrl;
            image.hidden = false;
        }

        if (fallback) {
            fallback.hidden = true;
        }

        onShow?.(resolvedUrl);
    }

    function showFile(file) {
        revoke();
        objectUrl = URL.createObjectURL(file);
        show(objectUrl);
    }

    return {
        clear,
        revoke,
        show,
        showFile,
    };
}

export { createImagePreviewController };
