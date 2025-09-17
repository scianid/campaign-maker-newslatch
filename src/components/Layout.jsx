import { Header } from './Header';
import { Footer } from './Footer';

export function Layout({ user, children, headerActions }) {
  return (
    <div className="min-h-screen bg-primary-bg">
      <Header user={user}>
        {headerActions}
      </Header>
      
      <main className="min-h-screen">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}