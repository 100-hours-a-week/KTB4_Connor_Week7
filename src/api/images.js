import { request } from "./client.js";
import { IMAGE_UPLOAD_FAILURE } from "../shared/constants/messages.js";

function uploadImage(file, fallbackMessage = IMAGE_UPLOAD_FAILURE) {
    return request(
        "/api/images/presigned-url",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                filename: file.name,
                contentType: file.type,
                size: file.size,
            }),
        },
        fallbackMessage
    ).then(async ({ uploadUrl, imageUrl, method, contentType }) => {
        const response = await fetch(uploadUrl, {
            method,
            headers: { "Content-Type": contentType },
            credentials: "omit",
            body: file,
        });

        if (!response.ok) {
            const error = new Error(fallbackMessage);
            error.status = response.status;
            throw error;
        }

        return imageUrl;
    });
}

export { uploadImage };
