"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type FeedFilter = "all" | "following" | "popular";

interface FeedFilterTabsProps {
  activeFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
}

export function FeedFilterTabs({
  activeFilter,
  onFilterChange,
}: FeedFilterTabsProps) {
  return (
    <Tabs
      value={activeFilter}
      onValueChange={(v) => onFilterChange(v as FeedFilter)}
    >
      <TabsList>
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="following">Following</TabsTrigger>
        <TabsTrigger value="popular">Popular</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
