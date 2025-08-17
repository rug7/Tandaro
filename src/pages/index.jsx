import Layout from "./Layout.jsx";
import Booking from "./Booking";
import MyReservations from "./MyReservations";
import AdminDashboard from "./AdminDashboard";
import AdminDriverPanel from "./AdminDriverPanel";
import DriverJobs from "./DriverJobs"; 
import { User } from "@/api/entities";

import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const PAGES = {
    Booking: Booking,
    MyReservations: MyReservations,
    AdminDashboard: AdminDashboard,
    AdminDriverPanel: AdminDriverPanel,
    DriverJobs: DriverJobs
}

// Protected Route Component
function ProtectedRoute({ children, requireAdmin = false, requireDriver = false }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && !user.is_admin) {
    return <Navigate to="/Booking" replace />;
  }

  if (requireDriver && user.role !== 'driver') {
    return <Navigate to="/Booking" replace />;
  }

  return children;
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                <Route path="/" element={<Booking />} />
                <Route path="/Booking" element={<Booking />} />
                <Route path="/MyReservations" element={<MyReservations />} />
                
                <Route path="/AdminDashboard" element={
                    <ProtectedRoute requireAdmin={true}>
                        <AdminDashboard />
                    </ProtectedRoute>
                } />
                
                <Route path="/AdminDriverPanel" element={
                    <ProtectedRoute requireAdmin={true}>
                        <AdminDriverPanel />
                    </ProtectedRoute>
                } />
                
                <Route path="/DriverJobs" element={
                    <ProtectedRoute requireDriver={true}>
                        <DriverJobs />
                    </ProtectedRoute>
                } />
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}