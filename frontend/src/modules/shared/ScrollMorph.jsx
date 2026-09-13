"use client";

import { useRef, useState, useEffect } from "react";

/**
 * ScrollMorph - High-performance GPU-accelerated architectural scroll morph wrapper.
 * Morphs elements from an organic condensed/perspective state into their crisp architectural
 * layout as the user scrolls through the page.
 */
export default function ScrollMorph({
  children,
  variant = "card",
  delay = 0,
  duration = 800,
  threshold = 0.01,
  rootMargin = "120px 0px 50px 0px",
  once = true,
  className = "",
  style = {},
  ...props
}) {
  const domRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = domRef.current;
    if (!node) return;

    // Immediate viewport check for page load / scroll restoration
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight + 100 && rect.bottom > -100) {
      setIsVisible(true);
      if (once) return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(node);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(node);
    return () => {
      if (node) observer.unobserve(node);
    };
  }, [threshold, rootMargin, once]);

  // Variant transform & filter states
  const getMorphStyles = () => {
    switch (variant) {
      case "isometric-pop":
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible
            ? "perspective(1200px) rotateX(0deg) translateY(0px) scale(1)"
            : "perspective(1200px) rotateX(14deg) translateY(48px) scale(0.92)",
          filter: isVisible ? "blur(0px)" : "blur(3px)",
        };
      case "shutter-rise":
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible
            ? "perspective(1200px) translateY(0px) rotateX(0deg) skewY(0deg)"
            : "perspective(1200px) translateY(55px) rotateX(10deg) skewY(-0.5deg)",
          clipPath: isVisible
            ? "inset(0% 0% 0% 0% round 1rem)"
            : "inset(12% 0% 0% 0% round 1rem)",
          filter: isVisible ? "blur(0px)" : "blur(2px)",
        };
      case "fan-left":
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible
            ? "perspective(1100px) rotateY(0deg) translateX(0px) scale(1)"
            : "perspective(1100px) rotateY(16deg) translateX(-40px) scale(0.94)",
          filter: isVisible ? "blur(0px)" : "blur(3px)",
        };
      case "fan-right":
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible
            ? "perspective(1100px) rotateY(0deg) translateX(0px) scale(1)"
            : "perspective(1100px) rotateY(-16deg) translateX(40px) scale(0.94)",
          filter: isVisible ? "blur(0px)" : "blur(3px)",
        };
      case "portal-expand":
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible
            ? "perspective(1400px) scale(1) translateY(0px) rotateX(0deg)"
            : "perspective(1400px) scale(0.9) translateY(45px) rotateX(5deg)",
          filter: isVisible ? "blur(0px)" : "blur(4px)",
        };
      case "timeline-node":
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible
            ? "perspective(1000px) scale(1) translateY(0px) rotateX(0deg)"
            : "perspective(1000px) scale(0.88) translateY(35px) rotateX(-8deg)",
          filter: isVisible ? "blur(0px)" : "blur(2px)",
        };
      case "curtain-wipe":
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0px)" : "translateY(25px)",
          clipPath: isVisible ? "inset(0% 0% 0% 0%)" : "inset(0% 100% 0% 0%)",
        };
      case "card":
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible
            ? "perspective(1200px) translateY(0px) scale(1) rotateX(0deg)"
            : "perspective(1200px) translateY(40px) scale(0.95) rotateX(4deg)",
          filter: isVisible ? "blur(0px)" : "blur(3px)",
        };
      case "fade-up":
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0px)" : "translateY(32px)",
          filter: isVisible ? "blur(0px)" : "blur(2px)",
        };
      case "scale":
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "scale(1)" : "scale(0.92)",
          filter: isVisible ? "blur(0px)" : "blur(2px)",
        };
      case "slide-left":
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateX(0px)" : "translateX(-35px)",
          filter: isVisible ? "blur(0px)" : "blur(2px)",
        };
      case "slide-right":
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateX(0px)" : "translateX(35px)",
          filter: isVisible ? "blur(0px)" : "blur(2px)",
        };
      case "tilt":
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible
            ? "perspective(1000px) rotateY(0deg) translateY(0px)"
            : "perspective(1000px) rotateY(-6deg) translateY(30px)",
        };
      default:
        return {
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0px)" : "translateY(24px)",
        };
    }
  };

  const morphStyles = getMorphStyles();

  return (
    <div
      ref={domRef}
      className={`will-change-transform will-change-[opacity,filter] ${className}`}
      style={{
        ...morphStyles,
        transitionProperty: "transform, opacity, filter, clip-path, border-radius, box-shadow",
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
