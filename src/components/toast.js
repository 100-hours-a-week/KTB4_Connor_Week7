function createToast(toastElement, duration = 1800) {
    let timer = 0;

    function hide() {
        clearTimeout(timer);
        toastElement.hidden = true;
    }

    function show() {
        clearTimeout(timer);
        toastElement.hidden = false;
        timer = setTimeout(() => {
            toastElement.hidden = true;
        }, duration);
    }

    return {
        hide,
        show,
    };
}

export { createToast };
