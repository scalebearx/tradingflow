"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBrokers } from "@/hooks/use-brokers";
import { AppSidebar } from "@/components/app-sidebar";
import { BrokerSelector } from "@/components/broker-selector";
import { TradingInterface } from "@/components/trading-interface";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export default function TradePage() {
  const { data: brokers, isLoading } = useBrokers();
  const router = useRouter();

  // Redirect to first broker if available
  useEffect(() => {
    if (!isLoading && brokers && brokers.length > 0) {
      router.push(`/trade/${brokers[0].id}`);
    }
  }, [brokers, isLoading, router]);

  // Always show trade layout
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
                      <Skeleton className="h-[200px] w-full" />
                      <Skeleton className="h-[200px] w-full" />
                    </div>
                  </div>
                </>
              ) : brokers && brokers.length === 0 ? (
                <>
                  <div className="px-4 lg:px-6">
                    <div className="flex flex-1 items-center justify-center">
                      <div className="text-center space-y-4">
                        <h3 className="text-lg font-medium">Add brokers to start trading</h3>
                        <p className="text-muted-foreground">Connect your trading accounts to access trading features.</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="px-4 lg:px-6">
                    <TradingInterface />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 