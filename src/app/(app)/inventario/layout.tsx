import { InventoryTabs } from "@/components/inventory/inventory-tabs";

export default function InventoryLayout({ children }: LayoutProps<"/inventario">) {
  return (
    <>
      <InventoryTabs />
      {children}
    </>
  );
}
