function createConfirmDialog({
    backdrop,
    cancelButton,
    confirmButton,
    titleElement,
    descriptionElement,
    returnFocusElement,
} = {}) {
    let payload = null;

    function open({ title, description, payload: nextPayload = null } = {}) {
        payload = nextPayload;

        if (titleElement && typeof title === "string") {
            titleElement.textContent = title;
        }

        if (descriptionElement && typeof description === "string") {
            descriptionElement.textContent = description;
        }

        backdrop.hidden = false;
        document.body.classList.add("modal-open");
        cancelButton?.focus();
    }

    function close({ restoreFocus = true } = {}) {
        backdrop.hidden = true;
        document.body.classList.remove("modal-open");
        payload = null;

        if (restoreFocus) {
            returnFocusElement?.focus();
        }
    }

    function getPayload() {
        return payload;
    }

    function setConfirmLoading(isLoading) {
        if (confirmButton) {
            confirmButton.disabled = isLoading;
        }
    }

    cancelButton?.addEventListener("click", () => close());
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !backdrop.hidden) {
            close();
        }
    });

    return {
        close,
        getPayload,
        open,
        setConfirmLoading,
    };
}

export { createConfirmDialog };
