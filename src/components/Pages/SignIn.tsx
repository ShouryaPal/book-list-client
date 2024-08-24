import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

import axios from "axios";
import { Toaster, toast } from "sonner";
import { loginSchema } from "@/schema/user";
import { useNavigate } from "@tanstack/react-router";
import useUserStore from "@/hooks/useUserStore";
import Cookies from "js-cookie";

const SignIn = () => {
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });
  const navigate = useNavigate();
  const { setUser, refetchUser } = useUserStore();

  const handleCustomerSignUp = () => {
    navigate({ to: "/signup" });
  };

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    console.log("Form submitted with values:", values); // Debug log
    try {
      console.log("Attempting to make API call..."); // Debug log
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/user/auth/login`,
        values,
        { withCredentials: true }
      );
      console.log("API response:", response); // Debug log
      toast.success("Login successful!");

      // Wait for 2 seconds before proceeding
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const token = Cookies.get("token");

      if (!token) {
        console.log("No token found");
      } else {
        console.log(token);
      }

      const userData = await refetchUser();
      if (userData) {
        setUser(userData);
        navigate({ to: "/" });
      } else {
        toast.error("Failed to fetch user data after login");
      }
    } catch (error) {
      console.error("Error during submission:", error); // More detailed error logging
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data || "An unexpected error occurred");
        console.error("Login error:", error.response?.data);
      } else {
        toast.error("An unexpected error occurred");
        console.error("An unexpected error occurred:", error);
      }
    }
  };

  return (
    <main className="w-full h-screen bg-orange-300 flex items-center justify-center">
      <Toaster position="top-center" richColors closeButton />
      <Card className="w-80">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Place in your table</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="xyz@xyz.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="xyz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit">Sign In</Button>
              <section className="text-center">
                Not an account?
                <Button variant={"link"} onClick={handleCustomerSignUp}>
                  Sign Up
                </Button>
              </section>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </main>
  );
};

export default SignIn;
