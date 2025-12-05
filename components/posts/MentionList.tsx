"use client";

import { forwardRef, useImperativeHandle, useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { MentionMember, MentionListRef } from "@/lib/tiptap/extensions";

interface MentionListProps {
  items: MentionMember[];
  command: (props: { id: string; label: string }) => void;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Ensure selectedIndex is always valid for current items
    const validIndex =
      props.items.length > 0
        ? Math.min(selectedIndex, props.items.length - 1)
        : 0;

    const selectItem = useCallback(
      (index: number) => {
        const item = props.items[index];
        if (item) {
          props.command({ id: item.id, label: item.name });
        }
      },
      [props]
    );

    const upHandler = useCallback(() => {
      setSelectedIndex((prev) => {
        const length = props.items.length;
        if (length === 0) return 0;
        return (prev + length - 1) % length;
      });
    }, [props.items.length]);

    const downHandler = useCallback(() => {
      setSelectedIndex((prev) => {
        const length = props.items.length;
        if (length === 0) return 0;
        return (prev + 1) % length;
      });
    }, [props.items.length]);

    const enterHandler = useCallback(() => {
      selectItem(validIndex);
    }, [selectItem, validIndex]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === "ArrowUp") {
          upHandler();
          return true;
        }
        if (event.key === "ArrowDown") {
          downHandler();
          return true;
        }
        if (event.key === "Enter") {
          enterHandler();
          return true;
        }
        return false;
      },
    }));

    if (props.items.length === 0) {
      return null;
    }

    return (
      <div className="bg-popover text-popover-foreground z-50 min-w-[200px] overflow-hidden rounded-md border p-1 shadow-md">
        {props.items.map((item, index) => (
          <button
            key={item.id}
            className={cn(
              "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none",
              index === validIndex
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            )}
            onClick={() => selectItem(index)}
            type="button"
          >
            <Avatar className="h-6 w-6">
              {item.avatar && <AvatarImage src={item.avatar} alt={item.name} />}
              <AvatarFallback className="text-xs">
                {item.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{item.name}</span>
          </button>
        ))}
      </div>
    );
  }
);

MentionList.displayName = "MentionList";
