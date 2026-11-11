import type { MetadataRoute } from 'next';

/** Chặn toàn bộ công cụ tìm kiếm — link chia sẻ không được index (BRIEF §9). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: '/' }],
  };
}
