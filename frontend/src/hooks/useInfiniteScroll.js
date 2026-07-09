import { useState, useEffect, useRef, useMemo } from "react";

export function useInfiniteScroll(allItems = [], pageSize = 30) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const observerRef = useRef(null);

  // هروقت لیست کل داده‌ها عوض شد (مثلاً سرچ شد یا از سرور لود شد)، تعداد نمایشی رو ریست کنیم
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [allItems, pageSize]);

  // جدا کردن آیتم‌های مجاز برای نمایش فعلی
  const visibleItems = useMemo(() => {
    return allItems.slice(0, visibleCount);
  }, [allItems, visibleCount]);

  useEffect(() => {
    const target = observerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          // اگر به انتهای صفحه رسیدیم و هنوز آیتم نمایش‌داده‌نشده داریم
          if (visibleCount < allItems.length) {
            setVisibleCount((prev) => prev + pageSize);
          }
        }
      },
      { threshold: 0.1 }, // وقتی ۱۰ درصد المان انتهایی دیده شد، لود کن
    );

    observer.observe(target);

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [allItems.length, visibleCount, pageSize]);

  const hasMore = visibleCount < allItems.length;

  return {
    visibleItems,
    hasMore,
    loaderRef: observerRef,
  };
}
