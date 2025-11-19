"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface AuthorImageProps {
  author: string;
  className?: string;
}

// In-memory cache for author images
const imageCache = new Map<string, string>();

export default function AuthorImage({
  author,
  className = "",
}: AuthorImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchAuthorImage = async () => {
      // Check cache first
      if (imageCache.has(author)) {
        setImageUrl(imageCache.get(author)!);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setHasError(false);

        // Fetch from external API
        const apiUrl = process.env.NEXT_PUBLIC_AUTHOR_IMAGE_API_URL || "";
        const apiKey = process.env.NEXT_PUBLIC_AUTHOR_IMAGE_API_KEY || "";

        if (!apiUrl) {
          // If no API URL is configured, show fallback immediately
          setHasError(true);
          setIsLoading(false);
          return;
        }

        // Build API request URL (this is a placeholder - adjust based on actual API)
        const params = new URLSearchParams({
          author: author,
        });

        if (apiKey) {
          params.append("key", apiKey);
        }

        const response = await fetch(`${apiUrl}?${params.toString()}`);

        if (!response.ok) {
          throw new Error("Failed to fetch author image");
        }

        const data = await response.json();
        const url = data.imageUrl || data.url || data.image;

        if (url) {
          // Cache the successful result
          imageCache.set(author, url);
          setImageUrl(url);
        } else {
          throw new Error("No image URL in response");
        }
      } catch (error) {
        console.error(`Failed to fetch image for author "${author}":`, error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuthorImage();
  }, [author]);

  // Show loading state
  if (isLoading) {
    return (
      <div
        className={`bg-slate-200 animate-pulse rounded-full ${className}`}
        style={{ width: "64px", height: "64px" }}
      />
    );
  }

  // Show fallback image on error or no image
  if (hasError || !imageUrl) {
    return (
      <div
        className={`bg-slate-300 rounded-full flex items-center justify-center ${className}`}
        style={{ width: "64px", height: "64px" }}
      >
        <svg
          className="w-8 h-8 text-slate-500"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  }

  // Show the author image
  return (
    <div className={`relative rounded-full overflow-hidden ${className}`}>
      <Image
        src={imageUrl}
        alt={`${author} portrait`}
        width={64}
        height={64}
        className="object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}
