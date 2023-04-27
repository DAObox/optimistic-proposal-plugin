import { ConnectButton } from "@rainbow-me/rainbowkit";
import { NavItem } from "./Layout";

interface NavbarProps {
  navItems: NavItem[];
  onNavItemClick: (clickedItemName: string) => void;
}

export function Navbar({ navItems, onNavItemClick }: NavbarProps) {
  return (
    <nav className="bg-base-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <NavLeft navItems={navItems} onNavItemClick={onNavItemClick} />
          <NavRight />
        </div>
      </div>
    </nav>
  );
}

function NavLeft({ navItems, onNavItemClick }: NavbarProps) {
  return (
    <div className="flex items-center">
      <NavLogo />
      <div className="hidden md:block">
        <div className="ml-10 flex items-baseline space-x-4">
          {navItems.map((item: NavItem) => (
            <button
              className={`btn-sm btn ${
                item.current ? "btn-primary btn-active" : "btn-ghost btn-active"
              }`}
              onClick={() => onNavItemClick(item.name)}
              key={item.name}
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
function NavRight() {
  return (
    <div className="hidden md:block">
      <div className="ml-4 flex items-center md:ml-6">
        <ConnectButton />
      </div>
    </div>
  );
}

function NavLogo() {
  return (
    <div className="flex-shrink-0">
      <img className="w-33 h-8" src="/daobox.png" alt="Your Company" />
    </div>
  );
}
