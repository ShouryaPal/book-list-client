import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import App from "./App";
import Home from "./components/Pages/Home";
import SignUp from "./components/Pages/SignUp";
import SignIn from "./components/Pages/SignIn";
import ExchangeRequestsPage from "./components/Pages/Interested";

const rootRoute = createRootRoute({
  component: App,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});

const signUpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: SignUp,
});

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signin",
  component: SignIn,
});

const interestRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/interest",
  component: ExchangeRequestsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  signUpRoute,
  signInRoute,
  interestRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
