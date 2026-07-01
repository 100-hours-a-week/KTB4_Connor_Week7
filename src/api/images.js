import { request } from "./client.js";
import { IMAGE_UPLOAD_FAILURE } from "../constants/messages.js";

function uploadImage(file, fallbackMessage = IMAGE_UPLOAD_FAILURE) {
    const formData = new FormData();
    formData.append("image", file);

    return request(
        "/images",
        {
            method: "POST",
            body: formData,
        },
        fallbackMessage
    ).then((data) => data.imageUrl);
}

export { uploadImage };
