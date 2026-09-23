import type { Metadata } from 'next';
import { SignUpForm } from '@/components/Pages/SignUp/SignUpForm';

export const metadata: Metadata = { title: 'Criar conta · Finance Family' };

export default function SignUpPage() {
  return <SignUpForm />;
}
