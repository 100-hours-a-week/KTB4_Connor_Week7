import {request} from './client.js';

function uploadImage(file, fallbackMessage = "*이미지 업로드에 실패했습니다.") {
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

export {uploadImage};