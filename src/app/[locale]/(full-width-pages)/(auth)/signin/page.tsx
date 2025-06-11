import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proplex - Sign In",
  description: "Proplex - Sign In",
};

export default function SignIn() {
  return <SignInForm />;
}
