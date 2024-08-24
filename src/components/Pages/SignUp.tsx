import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { loginSchema } from "../../schema/user";
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
import { Toaster, toast } from "sonner"; // Import Toaster and toast from sonner
import { useNavigate } from "@tanstack/react-router";

const SignUp = () => {
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const navigate = useNavigate();

  const handleCustomerSignIn = () => {
    navigate({ to: "/signin" });
  };

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      const email = values.email;
      const password = values.password;
      const name = values.name;
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/user/auth/register`,
        {
          email,
          password,
          name,
        }
      );
      if (res) {
        toast.success("Signup successful!");
        setTimeout(() => {
          navigate({ to: "/signin" });
        }, 500);
      }
    } catch (err) {
      toast.error("Signup failed. Please try again." + err);
    }
  }

  return (
    <main className="w-full h-screen bg-orange-300 flex items-center justify-center">
      <Toaster position="top-center" />
      <Card className="w-80">
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>Place in your table</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                      <Input
                        type="password"
                        placeholder="********"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit">Sign Up</Button>
              <section className="text-center">
                Already have an account?
                <Button variant={"link"} onClick={handleCustomerSignIn}>
                  Sign In
                </Button>
              </section>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </main>
  );
};

export default SignUp;
