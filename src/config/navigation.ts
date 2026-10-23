import {
  Beef,
  ClipboardList,
  HandCoins,
  Home,
  LayoutGrid,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  Target,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  slug: string;
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Bloque del roadmap en el que se entrega (docs/roadmap/03). */
  block: string;
  available: boolean;
  /** Aparece en la barra inferior del móvil. */
  mobile?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  {
    slug: "",
    href: "/",
    label: "Inicio",
    description: "Resumen del día",
    icon: Home,
    block: "B6",
    available: true,
    mobile: true,
  },
  {
    slug: "inventario",
    href: "/inventario",
    label: "Inventario",
    description: "Productos, existencias, kardex y traspasos",
    icon: Package,
    block: "B3",
    available: false,
    mobile: true,
  },
  {
    slug: "ventas",
    href: "/ventas",
    label: "Ventas",
    description: "Registro de ventas al contado, crédito, intercambio y reproas",
    icon: ShoppingCart,
    block: "B4",
    available: false,
    mobile: true,
  },
  {
    slug: "cobros",
    href: "/cobros",
    label: "Cobros",
    description: "Cuentas por cobrar y estado de cuenta de clientes",
    icon: HandCoins,
    block: "B4",
    available: false,
    mobile: true,
  },
  {
    slug: "compras",
    href: "/compras",
    label: "Compras",
    description: "Compras, proveedores y cuentas por pagar",
    icon: ReceiptText,
    block: "B5",
    available: false,
  },
  {
    slug: "reportes",
    href: "/reportes",
    label: "Reportes",
    description: "Reportes diarios, mensuales, kardex y saldos",
    icon: ClipboardList,
    block: "B6",
    available: false,
  },
  {
    slug: "cargo",
    href: "/cargo",
    label: "Cargo a rendir",
    description: "Fondos entregados, gastos y rendiciones",
    icon: Wallet,
    block: "B8",
    available: false,
  },
  {
    slug: "predios",
    href: "/predios",
    label: "Predios",
    description: "Hojas de envío a predios ganaderos",
    icon: Truck,
    block: "B9",
    available: false,
  },
  {
    slug: "ganado",
    href: "/ganado",
    label: "Contador de ganado",
    description: "Conteos por predio, productor, categoría y edad",
    icon: Beef,
    block: "B9",
    available: false,
  },
  {
    slug: "metas",
    href: "/metas",
    label: "Metas",
    description: "Barras de metas y tareas",
    icon: Target,
    block: "B10",
    available: false,
  },
  {
    slug: "configuracion",
    href: "/configuracion",
    label: "Configuración",
    description: "Empresa, sucursales, usuarios y catálogos",
    icon: Settings,
    block: "B2",
    available: false,
  },
];

/** Entrada "Más" de la barra inferior: agrupa lo que no cabe en el móvil. */
export const MORE_ITEM = {
  slug: "mas",
  href: "/mas",
  label: "Más",
  icon: LayoutGrid,
};

export function findNavItem(slug: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.slug === slug);
}
