import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LogOut, Workflow } from "lucide-react";
import useUserStore from "@/hooks/useUserStore";

const NavBar = () => {
  const { logout } = useUserStore();
  const navigate = useNavigate();

  function handleActions() {
    navigate({ to: "/interest" });
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate({ to: "/signin" });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  return (
    <nav className="w-full px-4 py-3 flex items-center justify-between border-b-2">
      <Link to="/" className="text-2xl font-semibold">
        BookHub
      </Link>
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          className="gap-1 border-2 p-2 sm:px-4"
          onClick={handleActions}
        >
          <Workflow className="h-4 w-4" />
          <span className="hidden sm:inline">Actions</span>
        </Button>

        <Button className="gap-1 p-2 sm:px-4" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Log Out</span>
        </Button>
      </div>
    </nav>
  );
};

export default NavBar;
