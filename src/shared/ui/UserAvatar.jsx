import { useState } from "react";
import { resolveImageUrl } from "../lib/image.js";

function UserAvatar({
  imageUrl,
  nickname,
  imageClassName = "header-avatar-image",
  fallbackClassName = "header-avatar-fallback",
}) {
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const resolvedImageUrl = resolveImageUrl(imageUrl);
  const showImage =
    Boolean(resolvedImageUrl) && resolvedImageUrl !== failedImageUrl;

  return showImage ? (
    <img
      className={imageClassName}
      src={resolvedImageUrl}
      alt={`${nickname || "사용자"} 프로필 사진`}
      onError={() => setFailedImageUrl(resolvedImageUrl)}
    />
  ) : (
    <span
      className={fallbackClassName}
      aria-hidden="true"
    >
      {nickname?.trim().charAt(0) || ""}
    </span>
  );
}

export { UserAvatar };
