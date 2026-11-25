"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { OpenedGiftDetails } from "@/types/calendar";

interface GiftRevealModalProps {
  gift: OpenedGiftDetails;
  onClose: () => void;
}

export function GiftRevealModal({ gift, onClose }: GiftRevealModalProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      onClose();
      return;
    }

    if (event.key !== "Tab" || !dialogRef.current) {
      return;
    }

    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
      <motion.div
        animate={{ opacity: 1 }}
        className="gift-modal-backdrop"
        data-testid="gift-reveal-modal"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
        transition={{ duration: 0.22 }}
      >
        <motion.section
          animate={{ opacity: 1, scale: 1, y: 0 }}
          aria-labelledby="gift-modal-title"
          aria-modal="true"
          className="gift-modal"
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          initial={{ opacity: 0, scale: 0.94, y: 22 }}
          onKeyDown={handleKeyDown}
          ref={dialogRef}
          role="dialog"
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        >
          <button
            aria-label="Zamknij prezent"
            className="modal-close-button"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" size={20} />
          </button>
          <div className="gift-modal-image-wrap">
            {!imageLoaded && !imageFailed ? (
              <span className="image-loading" role="status">
                Ładowanie prezentu…
              </span>
            ) : null}
            {imageFailed ? (
              <p className="image-error" role="alert">
                Nie udało się wczytać zdjęcia. Spróbuj ponownie za chwilę.
              </p>
            ) : (
              <Image
                alt={`Ilustracja prezentu: ${gift.title}`}
                className={`gift-modal-image${imageLoaded ? " gift-modal-image--loaded" : ""}`}
                height={640}
                onError={() => setImageFailed(true)}
                onLoad={() => setImageLoaded(true)}
                priority
                src={gift.imageUrl}
                unoptimized
                width={480}
              />
            )}
          </div>
          <div className="gift-modal-copy">
            <p className="eyebrow">Dzień {gift.dayNumber} grudnia</p>
            <h2 id="gift-modal-title">{gift.title}</h2>
            <p>{gift.description}</p>
          </div>
        </motion.section>
      </motion.div>
  );
}
