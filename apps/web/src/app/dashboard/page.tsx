"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBrokers } from "@/hooks/use-brokers";
import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { BrokerSelector } from "@/components/broker-selector";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import data from "./data.json";

export default function Page() {
  const { data: brokers, isLoading } = useBrokers();
  const router = useRouter();

  // Redirect to first broker if available
  useEffect(() => {
    if (!isLoading && brokers && brokers.length > 0) {
      router.push(`/dashboard/${brokers[0].id}`);
    }
  }, [brokers, isLoading, router]);

  // Always show dashboard layout
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <BrokerSelector />
              </div>
              {isLoading ? (
                <>
                  <div className="px-4 lg:px-6">
                    <div className="space-y-4">
                      <Skeleton className="h-[400px] w-full" />
                    </div>
                  </div>
                  <div className="px-4 lg:px-6">
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </div>
                </>
              ) : (!brokers || brokers.length === 0) ? (
                <>
                  <div className="px-4 lg:px-6">
                    <div className="flex flex-1 items-center justify-center">
                      <div className="text-center space-y-4">
                        <h3 className="text-lg font-medium">Add brokers to get started</h3>
                        <p className="text-muted-foreground">Connect your trading accounts to view charts and manage your portfolio.</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="px-4 lg:px-6">
                    <ChartAreaInteractive />
                  </div>
                  <DataTable data={data} />
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
