import useUserStore from "@/hooks/useUserStore";
import { useNavigate } from "@tanstack/react-router";

import BookTable from "../Booktable";
import NavBar from "../Navbar";

const Home = () => {
  const { user } = useUserStore();
  const navigate = useNavigate();

  console.log(user);

  if (!user) {
    navigate({ to: "/signin" });
    return null;
  }

  return (
    <div className="w-full h-screen">
      <NavBar />

      <div className="p-4">
        <BookTable />
      </div>
    </div>
  );
};

export default Home;
