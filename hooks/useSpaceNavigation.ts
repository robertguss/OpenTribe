"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

interface SpaceItem {
  _id: Id<"spaces">;
  name: string;
}

interface UseSpaceNavigationOptions {
  spaces: SpaceItem[] | undefined;
  enabled?: boolean;
}

interface UseSpaceNavigationReturn {
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  handleKeyDown: (e: React.KeyboardEvent, index: number) => void;
  isListening: boolean;
}

/**
 * Hook for keyboard navigation within the space sidebar.
 *
 * Keyboard shortcuts (per AC: 4):
 * - G+S: Focus the spaces list (shows focus ring on first space)
 * - J: Move focus down (next space)
 * - K: Move focus up (previous space)
 * - Enter: Navigate to the focused space
 * - Escape: Clear focus and stop listening
 *
 * The G+S combo requires pressing G first, then S within 1 second.
 */
export function useSpaceNavigation({
  spaces,
  enabled = true,
}: UseSpaceNavigationOptions): UseSpaceNavigationReturn {
  const router = useRouter();
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const gPressedRef = useRef(false);
  const gTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const spacesCount = spaces?.length ?? 0;

  // Navigate to focused space
  const navigateToSpace = useCallback(
    (index: number) => {
      if (spaces && index >= 0 && index < spaces.length) {
        const spaceId = spaces[index]._id;
        router.push(`/spaces/${spaceId}`);
      }
    },
    [spaces, router]
  );

  // Move focus up (K key)
  const moveFocusUp = useCallback(() => {
    if (!isListening || spacesCount === 0) return;
    setFocusedIndex((prev) => {
      if (prev <= 0) return spacesCount - 1; // Wrap to bottom
      return prev - 1;
    });
  }, [isListening, spacesCount]);

  // Move focus down (J key)
  const moveFocusDown = useCallback(() => {
    if (!isListening || spacesCount === 0) return;
    setFocusedIndex((prev) => {
      if (prev >= spacesCount - 1) return 0; // Wrap to top
      return prev + 1;
    });
  }, [isListening, spacesCount]);

  // Start keyboard navigation mode (G+S)
  const startNavigation = useCallback(() => {
    if (spacesCount === 0) return;
    setIsListening(true);
    setFocusedIndex(0);
  }, [spacesCount]);

  // Stop keyboard navigation mode
  const stopNavigation = useCallback(() => {
    setIsListening(false);
    setFocusedIndex(-1);
  }, []);

  // Handle key events for individual items
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (!isListening) return;

      switch (e.key) {
        case "ArrowUp":
        case "k":
          e.preventDefault();
          moveFocusUp();
          break;
        case "ArrowDown":
        case "j":
          e.preventDefault();
          moveFocusDown();
          break;
        case "Enter":
          e.preventDefault();
          navigateToSpace(index);
          break;
        case "Escape":
          e.preventDefault();
          stopNavigation();
          break;
      }
    },
    [isListening, moveFocusUp, moveFocusDown, navigateToSpace, stopNavigation]
  );

  // Global keyboard listener for G+S combo and navigation keys
  useEffect(() => {
    if (!enabled) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Handle G+S combo to start navigation
      if (e.key.toLowerCase() === "g" && !gPressedRef.current && !isListening) {
        gPressedRef.current = true;
        // Clear after 1 second
        gTimeoutRef.current = setTimeout(() => {
          gPressedRef.current = false;
        }, 1000);
        return;
      }

      if (e.key.toLowerCase() === "s" && gPressedRef.current) {
        e.preventDefault();
        gPressedRef.current = false;
        if (gTimeoutRef.current) {
          clearTimeout(gTimeoutRef.current);
          gTimeoutRef.current = null;
        }
        startNavigation();
        return;
      }

      // When listening, handle J/K/Enter/Escape globally
      if (isListening) {
        switch (e.key.toLowerCase()) {
          case "j":
            e.preventDefault();
            moveFocusDown();
            break;
          case "k":
            e.preventDefault();
            moveFocusUp();
            break;
          case "enter":
            e.preventDefault();
            navigateToSpace(focusedIndex);
            break;
          case "escape":
            e.preventDefault();
            stopNavigation();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      if (gTimeoutRef.current) {
        clearTimeout(gTimeoutRef.current);
      }
    };
  }, [
    enabled,
    isListening,
    focusedIndex,
    startNavigation,
    stopNavigation,
    moveFocusUp,
    moveFocusDown,
    navigateToSpace,
  ]);

  return {
    focusedIndex: isListening ? focusedIndex : -1,
    setFocusedIndex,
    handleKeyDown,
    isListening,
  };
}
