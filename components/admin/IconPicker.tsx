"use client";

import { useState } from "react";
import {
  Home,
  MessageCircle,
  BookOpen,
  Calendar,
  Users,
  Star,
  Heart,
  Lightbulb,
  Code,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type IconOption = {
  name: string;
  icon: LucideIcon;
};

const iconOptions: IconOption[] = [
  { name: "Home", icon: Home },
  { name: "MessageCircle", icon: MessageCircle },
  { name: "BookOpen", icon: BookOpen },
  { name: "Calendar", icon: Calendar },
  { name: "Users", icon: Users },
  { name: "Star", icon: Star },
  { name: "Heart", icon: Heart },
  { name: "Lightbulb", icon: Lightbulb },
  { name: "Code", icon: Code },
  { name: "Trophy", icon: Trophy },
];

// Valid icon names for validation
const validIconNames = new Set(iconOptions.map((opt) => opt.name));

// Check if a string is likely an emoji (starts with emoji character)
function isLikelyEmoji(str: string): boolean {
  if (!str || str.length === 0) return false;
  // Check if first character is in emoji unicode ranges
  const codePoint = str.codePointAt(0);
  if (!codePoint) return false;
  // Emoji ranges: emoticons, dingbats, symbols, etc.
  return (
    (codePoint >= 0x1f300 && codePoint <= 0x1f9ff) || // Miscellaneous Symbols and Pictographs, Emoticons, etc.
    (codePoint >= 0x2600 && codePoint <= 0x26ff) || // Miscellaneous Symbols
    (codePoint >= 0x2700 && codePoint <= 0x27bf) || // Dingbats
    (codePoint >= 0x1f600 && codePoint <= 0x1f64f) || // Emoticons
    (codePoint >= 0x1f680 && codePoint <= 0x1f6ff) // Transport and Map Symbols
  );
}

// Validate icon input - returns true if valid
function isValidIcon(value: string | undefined): boolean {
  if (!value || value.length === 0) return true; // Empty is valid (optional)
  if (validIconNames.has(value)) return true; // Valid Lucide icon name
  if (isLikelyEmoji(value)) return true; // Likely an emoji
  return false;
}

type IconPickerProps = {
  value?: string;
  onChange: (value: string) => void;
};

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");

  // Check if value is a Lucide icon name
  const selectedIcon = iconOptions.find((opt) => opt.name === value);

  // Check if value is an emoji (single character or emoji sequence)
  const isEmoji = value && !selectedIcon && isLikelyEmoji(value);

  // Validate the current input
  const isValid = isValidIcon(value);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleIconSelect = (iconName: string) => {
    setInputValue(iconName);
    onChange(iconName);
    setIsOpen(false);
  };

  // Render the current selection preview
  const renderPreview = () => {
    if (selectedIcon) {
      const Icon = selectedIcon.icon;
      return <Icon className="h-5 w-5" />;
    }
    if (isEmoji) {
      return <span className="text-lg">{value}</span>;
    }
    if (value && !isValid) {
      return <span className="text-destructive text-xs">Invalid</span>;
    }
    return <span className="text-muted-foreground text-sm">No icon</span>;
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Type emoji or select icon..."
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          className={cn("flex-1", !isValid && "border-destructive")}
        />

        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
            >
              {renderPreview()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[280px] p-2" align="end">
            <div className="grid grid-cols-5 gap-1">
              {iconOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <Button
                    key={option.name}
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-10 w-10",
                      value === option.name && "bg-muted"
                    )}
                    onClick={() => handleIconSelect(option.name)}
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                );
              })}
            </div>
            <p className="text-muted-foreground mt-2 text-center text-xs">
              Or type an emoji in the input field
            </p>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {!isValid && (
        <p className="text-destructive text-xs">
          Invalid icon. Use an emoji or select from the dropdown.
        </p>
      )}
    </div>
  );
}
