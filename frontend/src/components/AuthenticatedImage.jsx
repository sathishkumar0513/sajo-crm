import { useEffect, useState } from "react";

import api from "../api";

const API_ORIGIN = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8000/api" : `${window.location.origin}/api`)).replace(/\/api\/?$/, "");

function imageUrl(value) {
  if (typeof value !== "string" || !value) return "";
  if (value.startsWith("data:") || value.startsWith("blob:")) return value;
  if (value.includes("/api/media/")) return value;
  const mediaPath = value.includes("/media/") ? value.split("/media/")[1] : value.replace(/^\/+/, "");
  return `${API_ORIGIN}/api/media/${mediaPath}`;
}

export default function AuthenticatedImage({ src, alt = "", className = "" }) {
  const [objectUrl, setObjectUrl] = useState("");

  useEffect(() => {
    const resolvedUrl = imageUrl(src);
    setObjectUrl("");
    if (!resolvedUrl || resolvedUrl.startsWith("data:") || resolvedUrl.startsWith("blob:")) {
      setObjectUrl(resolvedUrl || "");
      return undefined;
    }

    let active = true;
    let loadedUrl = "";
    api.get(resolvedUrl, { responseType: "blob" })
      .then(({ data }) => {
        loadedUrl = URL.createObjectURL(data);
        if (active) setObjectUrl(loadedUrl);
        else URL.revokeObjectURL(loadedUrl);
      })
      .catch(() => {
        if (active) setObjectUrl("");
      });

    return () => {
      active = false;
      if (loadedUrl) URL.revokeObjectURL(loadedUrl);
    };
  }, [src]);

  if (!objectUrl) return null;
  return <img src={objectUrl} alt={alt} className={className} />;
}
