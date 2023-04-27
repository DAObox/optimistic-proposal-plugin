import { useState } from "react";
import { Navbar } from "./Navbar";
import { Main } from "./Main";
import { useRouter } from "next/router";

export const navigation = [
  { name: "Dashboard", href: "/", current: true },
  { name: "Proposals", href: "/proposals", current: false },
  { name: "Arbitrator", href: "/arbitrator", current: false },
];

export interface NavItem {
  name: string;
  href: string;
  current: boolean;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [navItems, setNavItems] = useState(navigation);
  const router = useRouter();

  const handleNavItemClick = (clickedItemName: string) => {
    setNavItems((prevItems) =>
      prevItems.map((item) =>
        item.name === clickedItemName
          ? { ...item, current: true }
          : { ...item, current: false }
      )
    );

    const clickedNavItem = navItems.find(
      (item) => item.name === clickedItemName
    );
    if (clickedNavItem) {
      router.push(clickedNavItem.href);
    }
  };

  const getCurrentNavItemName = () => {
    const currentItem = navItems.find((item) => item.current);
    return currentItem ? currentItem.name : "";
  };

  return (
    <div className="min-h-full flex-col">
      <Navbar navItems={navItems} onNavItemClick={handleNavItemClick} />
      <Main title={getCurrentNavItemName()}>{children}</Main>
    </div>
  );
}
