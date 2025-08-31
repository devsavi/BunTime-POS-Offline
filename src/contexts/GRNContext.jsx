import React, { createContext, useContext, useState, useEffect } from 'react';
import { getGRN } from '../services/localStorage';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const GRNContext = createContext();

export const useGRN = () => {
  const context = useContext(GRNContext);
  if (!context) {
    throw new Error('useGRN must be used within a GRNProvider');
  }
  return context;
};

export const GRNProvider = ({ children }) => {
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setGrns([]);
      setLoading(false);
      return;
    }

    try {
      // Load GRNs from localStorage
      const allGRNs = getGRN();
      const sortedGRNs = allGRNs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setGrns(sortedGRNs);
    } catch (error) {
      console.error('Error loading GRNs:', error);
      toast.error('Failed to load GRNs');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const searchGRNs = (searchTerm) => {
    return grns.filter(grn =>
      grn.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grn.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const addGRN = (grnData) => {
    try {
      // Get existing GRNs
      const existingGRNs = JSON.parse(localStorage.getItem('pos_grn') || '[]');
      const newGRN = { ...grnData, id: `grn_${Date.now()}` };
      
      // Add new GRN
      existingGRNs.push(newGRN);
      
      // Save to localStorage
      localStorage.setItem('pos_grn', JSON.stringify(existingGRNs));
      
      // Update state
      setGrns(prevGrns => [...prevGrns, newGRN].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      
      return { success: true, data: newGRN };
    } catch (error) {
      console.error('Error adding GRN:', error);
      return { success: false, error };
    }
  };

  const value = {
    grns,
    loading,
    searchGRNs,
    addGRN
  };

  return (
    <GRNContext.Provider value={value}>
      {children}
    </GRNContext.Provider>
  );
};