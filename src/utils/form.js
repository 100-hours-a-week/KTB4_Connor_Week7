function setHelperText(element, message = "") {
    element.textContent = message;
}

function setButtonLoading(button, isLoading, loadingText, idleText) {
    button.setAttribute("aria-busy", String(isLoading));
    button.textContent = isLoading ? loadingText : idleText;
}

function validateRequired(input, helper, message, shouldShowMessage = false) {
    const isValid = Boolean(input.value.trim());

    if (shouldShowMessage && !isValid) {
        setHelperText(helper, message);
    }

    return isValid;
}

export { setButtonLoading, setHelperText, validateRequired };
