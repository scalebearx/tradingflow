import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { TradingTabs } from "@/components/trading-tabs"
import { BrokerSelector } from "@/components/broker-selector"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

interface PageProps {
  params: {
    brokerId: string;
  };
}

export default function Page({ params }: PageProps) {
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
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <TradingTabs />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 