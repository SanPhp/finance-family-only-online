import type { Metadata } from 'next';
import { SignInForm } from '@/components/Pages/SignIn/SignInForm';

export const metadata: Metadata = { title: 'Entrar · Finance Family' };

export default function SignInPage() {
  return <SignInForm />;
}
