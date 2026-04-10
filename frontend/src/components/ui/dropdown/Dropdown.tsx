import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  menuRef?: React.Ref<HTMLDivElement>;
  portal?: boolean;
  anchorElement?: HTMLElement | null;
  offset?: number;
  style?: React.CSSProperties;
}

export const Dropdown: React.FC<DropdownProps> = ({
  isOpen,
  onClose,
  children,
  className = "",
  menuRef,
  portal = false,
  anchorElement,
  offset = 8,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties | null>(null);

  const setRefs = (node: HTMLDivElement | null) => {
    containerRef.current = node;

    if (typeof menuRef === "function") {
      menuRef(node);
      return;
    }

    if (menuRef) {
      (menuRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  useLayoutEffect(() => {
    if (!portal || !isOpen || !anchorElement) {
      setPortalStyle(null);
      return;
    }

    const updatePosition = () => {
      const rect = anchorElement.getBoundingClientRect();

      setPortalStyle({
        position: "fixed",
        top: rect.bottom + offset,
        left: rect.right,
        transform: "translateX(-100%)",
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorElement, isOpen, offset, portal]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".dropdown-toggle")
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (!isOpen) return null;

  const dropdownContent = (
    <div
      ref={setRefs}
      style={portal ? portalStyle ?? undefined : style}
      className={`z-40 rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark ${
        portal ? "fixed" : "absolute right-0 mt-2"
      } ${className}`}
    >
      {children}
    </div>
  );

  if (portal) {
    if (!portalStyle) return null;
    return createPortal(dropdownContent, document.body);
  }

  return dropdownContent;
};
