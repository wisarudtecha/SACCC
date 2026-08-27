import { useState } from "react";
import { Link } from "react-router";
import { useBannerList } from "../../banner/hook/useBannerData";
import { useTranslation } from "@/core/hooks/useTranslation";
const ITEMS_PER_VIEW = 3;

const ChevronLeft = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRight = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);


interface ArticleBannerCarouselProps {
  openTaget?: string;
}


const ArticleBannerCarousel: React.FC<ArticleBannerCarouselProps> = ({
  openTaget = '_self'
}) => {
  const { language } = useTranslation();
  const { data: banners = [], isLoading } = useBannerList(language, 'view');
  const [current, setCurrent] = useState(0);

  const total = banners.length;
  const maxIndex = Math.max(0, total - ITEMS_PER_VIEW);

  const prev = () => setCurrent((c) => (c > 0 ? c - 1 : maxIndex));
  const next = () => setCurrent((c) => (c < maxIndex ? c + 1 : 0));

  const visible = banners.slice(current, current + ITEMS_PER_VIEW);


  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-5 px-10">
        {Array.from({ length: ITEMS_PER_VIEW }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100"
          >
            <div className="aspect-[4/3] bg-gray-200" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-5/6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!total) return null;

  return (
    <div className="relative px-10">
      {/* Left arrow */}
      <button
        onClick={prev}
        aria-label="Previous"
        className="absolute left-0 top-[calc(50%-2rem)] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-700"
      >
        <ChevronLeft />
      </button>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-5">
        {visible.map((banner) => (
          <Link
            target={openTaget === "" ? "_self" : openTaget}
            key={banner.id}
            state={{ hideBack: openTaget !== "" }}
            to={`/kms/articles/${banner.articleId}`}
            className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="aspect-[4/3] overflow-hidden bg-gray-100">
              {banner.coverImage ? (
                <img
                  src={banner.coverImage}
                  alt={banner.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                  No Image
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-blue-600 group-hover:text-blue-700">
                {banner.title}
              </h3>
              {banner.description && (
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-gray-500">
                  {banner.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Right arrow */}
      <button
        onClick={next}
        aria-label="Next"
        className="absolute right-0 top-[calc(50%-2rem)] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-700"
      >
        <ChevronRight />
      </button>

      {/* Dots */}
      <div className="mt-5 flex justify-center gap-1.5">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(Math.min(i, maxIndex))}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-200 ${i === current
                ? "w-5 bg-blue-500"
                : "w-2 bg-gray-300 hover:bg-gray-400"
              }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ArticleBannerCarousel;
