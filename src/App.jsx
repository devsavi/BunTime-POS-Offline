import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';

import { InventoryProvider } from './contexts/InventoryContext';
import { BillingProvider } from './contexts/BillingContext';
import { CustomerProvider } from './contexts/CustomerContext';
import { GRNProvider } from './contexts/GRNContext';
import { ReturnsProvider } from './contexts/ReturnsContext';
import { UserProvider } from './contexts/UserContext';
import { ShopProvider } from './contexts/ShopContext';
import Dashboard from './components/dashboard/Dashboard';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
            <ShopProvider>
              <InventoryProvider>
                <BillingProvider>
                  <CustomerProvider>
                    <GRNProvider>
                      <ReturnsProvider>
                        <UserProvider>
                          <Router>
                            <div className="App">
                              <Routes>
                                <Route path="/dashboard/*" element={<Dashboard />} />
                                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                              </Routes>
                              <Toaster position="top-right" />
                            </div>
                          </Router>
                        </UserProvider>
                      </ReturnsProvider>
                    </GRNProvider>
                  </CustomerProvider>
                </BillingProvider>
              </InventoryProvider>
            </ShopProvider>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;