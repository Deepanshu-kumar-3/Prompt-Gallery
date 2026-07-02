import { useAdminAuth } from './AdminAuthProvider';

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAdminAuth();
  
  if (!isAdmin) {
    return null;
  }
  
  return <>{children}</>;
}
