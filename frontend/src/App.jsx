import React, { useEffect } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';

// Public Pages
import { Menu } from './pages/Menu';
import { ItemDetail } from './pages/ItemDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { TrackOrder } from './pages/TrackOrder';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { NotFound } from './pages/NotFound';
import { Auth } from './pages/Auth';
import { Account } from './pages/Account';
import { initGlobalSmoothScroll } from './utils/smoothScroll';

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Public Website Layout
const PublicLayout = () => {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - var(--header-height) - 300px)' }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export function App() {
  // Initialize Lenis buttery smooth momentum scroll ("Oil" / "ខាប់ៗ" physics)
  useEffect(() => {
    const cleanup = initGlobalSmoothScroll();
    return cleanup;
  }, []);

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public Customer Routes: Food List is the Homepage */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Menu />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/menu/:id" element={<ItemDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/account" element={<Account />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
