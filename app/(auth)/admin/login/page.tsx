import type { Metadata } from 'next';
import LoginForm from '@/components/admin/LoginForm';

export const metadata: Metadata = { title: 'Đăng nhập · Sổ Nợ' };

export default function LoginPage() {
  return <LoginForm />;
}
