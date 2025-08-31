import React, { useState, useMemo, useEffect } from 'react';
import { useBilling } from '../../contexts/BillingContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useGRN } from '../../contexts/GRNContext';
import { useReturns } from '../../contexts/ReturnsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useShop } from '../../contexts/ShopContext';
import { useTranslation } from 'react-i18next';
import { BarChart3, TrendingUp, Package, DollarSign, Calendar, Download, FileSpreadsheet, FileText, Truck, Eye, X, Trash2, Printer, RotateCcw, Calculator as CalculatorIcon } from 'lucide-react';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import InvoicePrint from '../billing/InvoicePrint';
import Calculator from '../common/Calculator';
import GRNView from '../inventory/GRNView';
import MultiShopReport from './MultiShopReport';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { generateId } from '../../services/localStorage';

const Reports = () => {
  const [dateRange, setDateRange] = useState('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [selectedGRN, setSelectedGRN] = useState(null);
  const [multiShopReportEnabled, setMultiShopReportEnabled] = useState(false);
  const [userRoles, setUserRoles] = useState({}); // Cache for user roles
  const [enhancedBills, setEnhancedBills] = useState([]); // Bills with role information
  const [enhancedGRNs, setEnhancedGRNs] = useState([]); // GRNs with user email information
  
  const { bills, deleteBill } = useBilling();
  const { products, getLowStockProducts, getOutOfStockProducts } = useInventory();
  const { grns } = useGRN();
  const { returns, getApprovedReturns } = useReturns();
  const { isAdmin, isSuperAdmin, isShopAdmin, isCashier } = useAuth();
  const { shopSettings } = useShop();
  const { t } = useTranslation();

  // Check if user can change date range (only super_admin and shop_admin)
  const canChangeDateRange = isSuperAdmin() || isShopAdmin();
  // Check if user can see inventory value (only super_admin)
  const canSeeInventoryValue = isSuperAdmin();

  // Function to get user role from localStorage
  const fetchUserRole = async (userId) => {
    if (userRoles[userId]) {
      return userRoles[userId];
    }
    
    try {
      const allUsers = JSON.parse(localStorage.getItem('pos_users') || '[]');
      const user = allUsers.find(u => u.id === userId);
      if (user) {
        const role = user.role || 'unknown';
        setUserRoles(prev => ({ ...prev, [userId]: role }));
        return role;
      }
    } catch (error) {
      console.error('Error getting user role:', error);
    }
    
    return 'unknown';
  };

  // Function to get user email from localStorage
  const fetchUserEmail = async (userId) => {
    try {
      const allUsers = JSON.parse(localStorage.getItem('pos_users') || '[]');
      const user = allUsers.find(u => u.id === userId);
      if (user) {
        return user.email || 'Unknown User';
      }
    } catch (error) {
      console.error('Error getting user email:', error);
    }
    
    return 'Unknown User';
  };

  // Effect to enhance bills with role information
  useEffect(() => {
    const enhanceBillsWithRoles = async () => {
      const enhanced = await Promise.all(
        bills.map(async (bill) => {
          if (bill.cashier?.role) {
            // Role already exists in bill
            return bill;
          } else if (bill.cashier?.id) {
            // Fetch role from Firestore
            const role = await fetchUserRole(bill.cashier.id);
            return {
              ...bill,
              cashier: {
                ...bill.cashier,
                role: role
              }
            };
          }
          return bill;
        })
      );
      setEnhancedBills(enhanced);
    };

    if (bills.length > 0) {
      enhanceBillsWithRoles();
    } else {
      setEnhancedBills([]);
    }
  }, [bills, userRoles]);

  // Effect to enhance GRNs with user email information
  useEffect(() => {
    const enhanceGRNsWithEmails = async () => {
      const enhanced = await Promise.all(
        grns.map(async (grn) => {
          if (grn.createdBy && grn.createdBy.includes('@')) {
            // Email already exists in GRN
            return grn;
          } else if (grn.createdBy) {
            // Fetch email from Firestore using user ID
            const email = await fetchUserEmail(grn.createdBy);
            return {
              ...grn,
              createdBy: email,
              createdById: grn.createdBy // Keep the original ID for reference
            };
          }
          return grn;
        })
      );
      setEnhancedGRNs(enhanced);
    };

    if (grns.length > 0) {
      enhanceGRNsWithEmails();
    } else {
      setEnhancedGRNs([]);
    }
  }, [grns]);

  const getDateRange = () => {
    const now = new Date();
    
    // Force cashiers to only see today's data
    const effectiveDateRange = canChangeDateRange ? dateRange : 'today';
    
    switch (effectiveDateRange) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'this_week':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'this_month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'custom':
        return {
          start: customStartDate ? new Date(customStartDate) : startOfMonth(now),
          end: customEndDate ? new Date(customEndDate) : endOfMonth(now)
        };
      default:
        return { start: startOfDay(now), end: endOfDay(now) };
    }
  };

  const filteredBills = useMemo(() => {
    const { start, end } = getDateRange();
    return enhancedBills.filter(bill => {
      const billDate = new Date(bill.createdAt);
      return isWithinInterval(billDate, { start, end });
    });
  }, [enhancedBills, dateRange, customStartDate, customEndDate]);

  const filteredGRNs = useMemo(() => {
    const { start, end } = getDateRange();
    // Filter GRNs by date only
    return enhancedGRNs.filter(grn => {
      const grnDate = new Date(grn.createdAt);
      return isWithinInterval(grnDate, { start, end });
    });
  }, [enhancedGRNs, dateRange, customStartDate, customEndDate]);

  const filteredReturns = useMemo(() => {
    const { start, end } = getDateRange();
    return returns.filter(returnItem => {
      const returnDate = new Date(returnItem.createdAt);
      return isWithinInterval(returnDate, { start, end });
    });
  }, [returns, dateRange, customStartDate, customEndDate]);

  const analytics = useMemo(() => {
    const totalSales = filteredBills.reduce((sum, bill) => sum + bill.total, 0);
    const totalTransactions = filteredBills.length;
    const avgTransactionValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    
    // GRN Analytics
    const totalGRNValue = filteredGRNs.reduce((sum, grn) => sum + grn.totalValue, 0);
    const totalGRNs = filteredGRNs.length;
    
    // Returns Analytics
    const approvedReturns = filteredReturns.filter(r => r.status === 'approved');
    const totalReturnsValue = approvedReturns.reduce((sum, returnItem) => sum + returnItem.totalValue, 0);
    const totalReturns = filteredReturns.length;
    
    // Top selling products
    const productSales = {};
    filteredBills.forEach(bill => {
      bill.items.forEach(item => {
        if (!productSales[item.id]) {
          productSales[item.id] = {
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.id].quantity += item.quantity;
        productSales[item.id].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Low selling products (products with lowest quantity sold)
    const lowSellingProducts = Object.values(productSales)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 10);

    // Payment methods breakdown
    const paymentMethods = {};
    filteredBills.forEach(bill => {
      const method = bill.payment.method;
      if (!paymentMethods[method]) {
        paymentMethods[method] = { count: 0, amount: 0 };
      }
      paymentMethods[method].count += 1;
      paymentMethods[method].amount += bill.total;
    });

    // Cashier/Admin sales breakdown
    const cashierSales = {};
    filteredBills.forEach(bill => {
      const cashierName = bill.cashier?.name || bill.cashier?.email || 'Unknown';
      const cashierEmail = bill.cashier?.email || 'Unknown';
      const role = bill.cashier?.role || 'unknown';
      
      if (!cashierSales[cashierEmail]) {
        cashierSales[cashierEmail] = {
          name: cashierName,
          email: cashierEmail,
          role: role,
          totalSales: 0,
          totalTransactions: 0,
          totalProductsSold: 0,
          avgTransactionValue: 0
        };
      }
      
      cashierSales[cashierEmail].totalSales += bill.total;
      cashierSales[cashierEmail].totalTransactions += 1;
      
      // Calculate total products sold (quantity of all items)
      const productsSoldInBill = bill.items.reduce((total, item) => total + item.quantity, 0);
      cashierSales[cashierEmail].totalProductsSold += productsSoldInBill;
      
      cashierSales[cashierEmail].avgTransactionValue = cashierSales[cashierEmail].totalSales / cashierSales[cashierEmail].totalTransactions;
    });

    // Convert to array and sort by total sales
    const cashierSalesArray = Object.values(cashierSales)
      .sort((a, b) => b.totalSales - a.totalSales);

    // Hourly sales (for today only) and daily sales (for this week)
    const hourlySales = {};
    const dailySales = {};
    
    if (dateRange === 'today') {
      for (let i = 0; i < 24; i++) {
        hourlySales[i] = 0;
      }
      filteredBills.forEach(bill => {
        const hour = new Date(bill.createdAt).getHours();
        hourlySales[hour] += bill.total;
      });
    } else if (dateRange === 'this_week') {
      // Initialize daily sales for the week
      const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      weekDays.forEach(day => {
        dailySales[day] = 0;
      });
      
      filteredBills.forEach(bill => {
        const dayOfWeek = new Date(bill.createdAt).getDay();
        const dayName = weekDays[dayOfWeek];
        dailySales[dayName] += bill.total;
      });
    }

    // Calculate total inventory value
    const totalInventoryValue = products.reduce((total, product) => {
      return total + (product.quantity * product.price);
    }, 0);

    return {
      totalSales,
      totalTransactions,
      avgTransactionValue,
      totalGRNValue,
      totalGRNs,
      totalReturnsValue,
      totalReturns,
      topProducts,
      lowSellingProducts,
      paymentMethods,
      cashierSalesArray,
      hourlySales,
      dailySales,
      totalInventoryValue
    };
  }, [filteredBills, filteredGRNs, filteredReturns, dateRange]);

  const handleDeleteBill = async (billId) => {
    if (!isAdmin()) {
      toast.error('Only administrators can delete bills');
      return;
    }

    try {
      const result = await deleteBill(billId);
      if (result.success) {
        setDeleteConfirm(null);
        toast.success('Bill deleted successfully!');
      }
    } catch (error) {
      toast.error('Error deleting bill: ' + error.message);
    }
  };

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
  };

  const handlePrintBill = (bill) => {
    setSelectedBill(bill);
    setShowInvoice(true);
  };

  const exportCSV = () => {
    const csvContent = [
      ['Bill Number', 'Date', 'Customer', 'Items', 'Subtotal', 'Discount', 'Total', 'Payment Method'],
      ...filteredBills.map(bill => [
        bill.billNumber,
        format(new Date(bill.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        bill.customer.name || 'Walk-in',
        bill.items.length,
        bill.subtotal,
        bill.discount.amount,
        bill.total,
        bill.payment.method
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    // Create workbook
    const wb = XLSX.utils.book_new();



    // Sales Summary Sheet
    const summaryData = [
      ['COMPREHENSIVE BUSINESS REPORT'],
      [''],
      ['Report Period:', `${format(getDateRange().start, 'yyyy-MM-dd')} to ${format(getDateRange().end, 'yyyy-MM-dd')}`],
      ['Generated On:', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],

      [''],
      ['KEY METRICS'],
      ['Metric', 'Value'],
      ['Total Sales Revenue', `${shopSettings.currency} ${analytics.totalSales.toLocaleString()}`],
      ['Total Transactions', analytics.totalTransactions],
      ['Average Transaction Value', `${shopSettings.currency} ${Math.round(analytics.avgTransactionValue).toLocaleString()}`],
      ['Total GRN Value', `${shopSettings.currency} ${analytics.totalGRNValue.toLocaleString()}`],
      ['Total GRNs Created', analytics.totalGRNs],
      ['Total Returns Value', `${shopSettings.currency} ${analytics.totalReturnsValue.toLocaleString()}`],
      ['Total Returns', analytics.totalReturns],
      ...(canSeeInventoryValue ? [['Total Inventory Value', `${shopSettings.currency} ${analytics.totalInventoryValue.toLocaleString()}`]] : []),
      ['Low Stock Items', getLowStockProducts().length],
      ['Out of Stock Items', getOutOfStockProducts().length],
      ['Total Products in System', products.length],
    ];
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Style the summary sheet
    summaryWS['!cols'] = [{ width: 25 }, { width: 20 }];
    XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');

    // Detailed Sales Sheet
    const salesData = [
      ['DETAILED SALES TRANSACTIONS'],
      [''],
      ['Bill Number', 'Date', 'Time', 'Customer Name', 'Customer Phone', 'Items Count', 'Products Purchased', `Subtotal (${shopSettings.currency})`, `Discount (${shopSettings.currency})`, `Total (${shopSettings.currency})`, 'Payment Method', 'Cashier Name']
    ];
    
    filteredBills.forEach(bill => {
      const productsList = bill.items.map(item => `${item.name} (Qty: ${item.quantity})`).join(', ');
      salesData.push([
        bill.billNumber,
        format(new Date(bill.createdAt), 'yyyy-MM-dd'),
        format(new Date(bill.createdAt), 'HH:mm:ss'),
        bill.customer.name || 'Walk-in Customer',
        bill.customer.phone || '',
        bill.items.length,
        productsList,
        bill.subtotal,
        bill.discount.amount || 0,
        bill.total,
        bill.payment.method.toUpperCase(),
        bill.cashier.name || bill.cashier.email
      ]);
    });
    
    const salesWS = XLSX.utils.aoa_to_sheet(salesData);
    salesWS['!cols'] = [
      { width: 15 }, { width: 12 }, { width: 10 }, { width: 20 }, 
      { width: 15 }, { width: 12 }, { width: 40 }, { width: 15 }, 
      { width: 15 }, { width: 15 }, { width: 15 }, { width: 25 }
    ];
    XLSX.utils.book_append_sheet(wb, salesWS, 'Sales Details');

    // Returns Sheet
    const returnsData = [
      ['RETURNS DETAILS'],
      [''],
      ['Return Number', 'Date', 'Status', 'Cashier', 'Customer', 'Product Name', 'Quantity', `Unit Price (${shopSettings.currency})`, `Total Value (${shopSettings.currency})`, 'Approved By', 'Approved Date', 'Rejected Date']
    ];
    
    filteredReturns.forEach(returnItem => {
      if (returnItem.items && returnItem.items.length > 0) {
        returnItem.items.forEach(item => {
          returnsData.push([
            returnItem.returnNumber,
            format(new Date(returnItem.createdAt), 'yyyy-MM-dd'),
            returnItem.status.toUpperCase(),
            returnItem.cashierName || returnItem.creatorEmail || 'Cashier', // Use cashierName with fallback to creatorEmail
            returnItem.customerName || 'N/A',
            item.productName || 'Unknown Product',
            item.quantity || 0,
            Math.round(item.productPrice || 0),
            Math.round((item.productPrice || 0) * (item.quantity || 0)),
            returnItem.approvedCashierName || 'Cashier', // Show selected cashier's name
            returnItem.approvedAt ? format(new Date(returnItem.approvedAt), 'yyyy-MM-dd') : '',
            returnItem.rejectedAt ? format(new Date(returnItem.rejectedAt), 'yyyy-MM-dd') : ''
          ]);
        });
      } else {
        // Fallback for returns without detailed items
        returnsData.push([
          returnItem.returnNumber,
          format(new Date(returnItem.createdAt), 'yyyy-MM-dd'),
          returnItem.status.toUpperCase(),
          returnItem.cashierName || returnItem.creatorEmail || 'Cashier', // Use cashierName with fallback to creatorEmail
          returnItem.customerName || 'N/A',
          'Mixed Items',
          returnItem.totalItems || 0,
          '',
          Math.round(returnItem.totalValue || 0),
          returnItem.approvedCashierName || 'Cashier', // Show selected cashier's name
          returnItem.approvedAt ? format(new Date(returnItem.approvedAt), 'yyyy-MM-dd') : '',
          returnItem.rejectedAt ? format(new Date(returnItem.rejectedAt), 'yyyy-MM-dd') : ''
        ]);
      }
    });
    
    const returnsWS = XLSX.utils.aoa_to_sheet(returnsData);
    returnsWS['!cols'] = [
      { width: 15 }, { width: 12 }, { width: 12 }, { width: 25 }, 
      { width: 20 }, { width: 30 }, { width: 10 }, { width: 15 }, 
      { width: 18 }, { width: 25 }, { width: 15 }, { width: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, returnsWS, 'Returns Details');

    // GRN Details Sheet
    const grnData = [
      ['GOODS RECEIVE NOTES (GRN) DETAILS'],
      [''],
      ['GRN Number', 'Date', 'Supplier', 'Supplier Contact', 'Invoice Number', 'Product Name', 'Quantity', `Unit Price (${shopSettings.currency})`, `Total Value (${shopSettings.currency})`, 'Status', 'Created By', 'Notes']
    ];
    
    filteredGRNs.forEach(grn => {
      if (grn.items && grn.items.length > 0) {
        grn.items.forEach(item => {
          const quantity = parseFloat(item.quantity) || 0;
          const price = parseFloat(item.price) || 0;
          const total = quantity * price;
          
          grnData.push([
            grn.grnNumber,
            format(new Date(grn.createdAt), 'yyyy-MM-dd'),
            grn.supplier,
            grn.supplierContact || '',
            grn.invoiceNumber || '',
            item.name || 'Unknown Product',
            quantity,
            price,
            total,
            grn.status.toUpperCase(),
            grn.cashierName || grn.createdBy || 'Unknown',
            grn.notes || ''
          ]);
        });
      } else {
        // Fallback for GRNs without detailed items
        grnData.push([
          grn.grnNumber,
          format(new Date(grn.createdAt), 'yyyy-MM-dd'),
          grn.supplier,
          grn.supplierContact || '',
          grn.invoiceNumber || '',
          'Mixed Items',
          grn.items?.length || 0,
          '',
          Math.round(grn.totalValue || 0),
          grn.status.toUpperCase(),
          grn.createdBy,
          grn.notes || ''
        ]);
      }
    });
    
    const grnWS = XLSX.utils.aoa_to_sheet(grnData);
    grnWS['!cols'] = [
      { width: 15 }, { width: 12 }, { width: 20 }, { width: 15 }, 
      { width: 15 }, { width: 30 }, { width: 10 }, { width: 15 }, 
      { width: 18 }, { width: 12 }, { width: 25 }, { width: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, grnWS, 'GRN Details');

    // Top Products Sheet
    const productsData = [
      ['TOP SELLING PRODUCTS'],
      [''],
      ['Rank', 'Product Name', 'Quantity Sold', `Revenue Generated (${shopSettings.currency})`, `Avg. Price per Unit (${shopSettings.currency})`]
    ];
    
    analytics.topProducts.forEach((product, index) => {
      productsData.push([
        index + 1,
        product.name,
        product.quantity,
        Math.round(product.revenue),
        Math.round(product.revenue / product.quantity)
      ]);
    });
    
    const productsWS = XLSX.utils.aoa_to_sheet(productsData);
    productsWS['!cols'] = [{ width: 8 }, { width: 30 }, { width: 15 }, { width: 20 }, { width: 20 }];
    XLSX.utils.book_append_sheet(wb, productsWS, 'Top Products');

    // Low Selling Products Sheet
    const lowProductsData = [
      ['LOW SELLING PRODUCTS'],
      [''],
      ['Rank', 'Product Name', 'Quantity Sold', `Revenue Generated (${shopSettings.currency})`, `Avg. Price per Unit (${shopSettings.currency})`]
    ];
    
    analytics.lowSellingProducts.forEach((product, index) => {
      lowProductsData.push([
        index + 1,
        product.name,
        product.quantity,
        Math.round(product.revenue),
        Math.round(product.revenue / product.quantity)
      ]);
    });
    
    const lowProductsWS = XLSX.utils.aoa_to_sheet(lowProductsData);
    lowProductsWS['!cols'] = [{ width: 8 }, { width: 30 }, { width: 15 }, { width: 20 }, { width: 20 }];
    XLSX.utils.book_append_sheet(wb, lowProductsWS, 'Low Selling Products');

    // Cashier Sales Performance Sheet
    const cashierSalesData = [
      ['CASHIER SALES PERFORMANCE'],
      [''],
      ['Rank', 'Cashier Name', 'Role', `Total Sales (${shopSettings.currency})`, 'Total Transactions', 'Products Sold', `Average Transaction Value (${shopSettings.currency})`]
    ];
    
    analytics.cashierSalesArray.forEach((cashier, index) => {
      cashierSalesData.push([
        index + 1,
        cashier.name || cashier.email,
        cashier.role.toUpperCase(),
        Math.round(cashier.totalSales),
        cashier.totalTransactions,
        cashier.totalProductsSold,
        Math.round(cashier.avgTransactionValue)
      ]);
    });
    
    const cashierSalesWS = XLSX.utils.aoa_to_sheet(cashierSalesData);
    cashierSalesWS['!cols'] = [{ width: 8 }, { width: 30 }, { width: 12 }, { width: 18 }, { width: 18 }, { width: 15 }, { width: 25 }];
    XLSX.utils.book_append_sheet(wb, cashierSalesWS, 'Cashier Performance');

    // Save the file
    const fileName = `comprehensive-business-report-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const exportPDF = () => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Comprehensive Business Report', 20, 20);
  
  // Add report period and generation date
  doc.setFontSize(12);
  doc.text(`Report Period: ${format(getDateRange().start, 'yyyy-MM-dd')} to ${format(getDateRange().end, 'yyyy-MM-dd')}`, 20, 35);
  doc.text(`Generated On: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, 20, 45);

  
  let yPosition = 70;
  
  // Summary Section
  doc.setFontSize(16);
  doc.text('KEY METRICS', 20, yPosition);
  yPosition += 10;
  
  // Create summary data array, conditionally including inventory value
  const summaryDataItems = [
    ['Metric', 'Value'],
    ['Total Sales Revenue', `${shopSettings.currency} ${analytics.totalSales.toLocaleString()}`],
    ['Total Transactions', analytics.totalTransactions.toString()],
    ['Average Transaction Value', `${shopSettings.currency} ${Math.round(analytics.avgTransactionValue).toLocaleString()}`],
    ['Total GRN Value', `${shopSettings.currency} ${analytics.totalGRNValue.toLocaleString()}`],
    ['Total GRNs Created', analytics.totalGRNs.toString()],
    ['Total Returns Value', `${shopSettings.currency} ${analytics.totalReturnsValue.toLocaleString()}`],
    ['Total Returns', analytics.totalReturns.toString()],
    ...(canSeeInventoryValue ? [['Total Inventory Value', `${shopSettings.currency} ${analytics.totalInventoryValue.toLocaleString()}`]] : []),
    ['Low Stock Items', getLowStockProducts().length.toString()],
    ['Out of Stock Items', getOutOfStockProducts().length.toString()],
    ['Total Products in System', products.length.toString()],
  ];
  
  autoTable(doc, {
    startY: yPosition,
    head: [summaryDataItems[0]],
    body: summaryDataItems.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 10 },
    margin: { left: 20, right: 20 }
  });
  
  yPosition = doc.lastAutoTable.finalY + 20;
    
    // Add new page if needed
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Top Selling Products Section
    doc.setFontSize(16);
    doc.text('TOP SELLING PRODUCTS', 20, yPosition);
    yPosition += 10;
    
    const topProductsData = [
      ['Rank', 'Product Name', 'Quantity Sold', 'Revenue (LKR)', 'Avg Price (LKR)'],
      ...analytics.topProducts.slice(0, 10).map((product, index) => [
        (index + 1).toString(),
        product.name,
        product.quantity.toString(),
        Math.round(product.revenue).toLocaleString(),
        Math.round(product.revenue / product.quantity).toLocaleString()
      ])
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [topProductsData[0]],
      body: topProductsData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
      styles: { fontSize: 9 },
      margin: { left: 20, right: 20 }
    });
    
    yPosition = doc.lastAutoTable.finalY + 20;
    
    // Add new page if needed
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }
    
    // Cashier Performance Section
    doc.setFontSize(16);
    doc.text('CASHIER PERFORMANCE', 20, yPosition);
    yPosition += 10;
    
    const cashierData = [
      ['Rank', 'Cashier Name', 'Role', 'Sales (LKR)', 'Transactions', 'Products Sold', 'Avg Transaction (LKR)'],
      ...analytics.cashierSalesArray.slice(0, 10).map((cashier, index) => [
        (index + 1).toString(),
        cashier.name || cashier.email,
        cashier.role.toUpperCase(),
        Math.round(cashier.totalSales).toLocaleString(),
        cashier.totalTransactions.toString(),
        cashier.totalProductsSold.toString(),
        Math.round(cashier.avgTransactionValue).toLocaleString()
      ])
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [cashierData[0]],
      body: cashierData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [168, 85, 247] },
      styles: { fontSize: 9 },
      margin: { left: 20, right: 20 }
    });
    
    yPosition = doc.lastAutoTable.finalY + 20;
    
    // Add new page for sales details
    doc.addPage();
    yPosition = 20;
    
    // Sales Details Section
    doc.setFontSize(16);
    doc.text('SALES DETAILS', 20, yPosition);
    yPosition += 10;
    
    const salesDetailsData = [
      ['Bill #', 'Date', 'Customer', 'Items', 'Products', 'Total (LKR)', 'Payment'],
      ...filteredBills.slice(0, 20).map(bill => [
        bill.billNumber,
        format(new Date(bill.createdAt), 'yyyy-MM-dd'),
        bill.customer.name || 'Walk-in',
        bill.items.length.toString(),
        bill.items.map(item => `${item.name} (${item.quantity})`).join(', '),
        Math.round(bill.total).toLocaleString(),
        bill.payment.method.toUpperCase()
      ])
    ];
    
    autoTable(doc, {
      startY: yPosition,
      head: [salesDetailsData[0]],
      body: salesDetailsData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
      margin: { left: 20, right: 20 }
    });
    
    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Page ${i} of ${pageCount}`, 170, 285);
      doc.text(`Generated by POS System - ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 20, 285);
    }
    
    // Save the PDF
    const fileName = `business-report-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.pdf`;
    doc.save(fileName);
    
    toast.success('PDF report generated successfully!');
  };

  return (
    <div className="space-y-4 sm:space-y-6 relative">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {t('reports')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Sales analytics, GRN reports, returns data and business insights
          </p>
        </div>
        
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-3">
          <button
            onClick={exportCSV}
            className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={exportExcel}
            className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
          
          <button
            onClick={exportPDF}
            className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            <FileText className="w-4 h-4" />
            <span>{t('exportPDF')}</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector with Calculator - Only visible for super_admin and shop_admin */}
      {canChangeDateRange && (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center justify-between">
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 hidden sm:block" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="today">{t('today')}</option>
                <option value="this_week">{t('thisWeek')}</option>
                <option value="this_month">{t('thisMonth')}</option>
                <option value="custom">{t('customRange')}</option>
              </select>

              {dateRange === 'custom' && (
                <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <span className="text-gray-500 dark:text-gray-400 text-center text-sm">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              )}
            </div>

            {/* Calculator Button */}
            <button
              onClick={() => setShowCalculator(true)}
              className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              title="Open Calculator"
            >
              <CalculatorIcon className="w-4 h-4" />
              <span>Calculator</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Cashier Date Display - Shows only today's date */}
      {!canChangeDateRange && (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center justify-between">
            <div className="flex items-center space-x-4">
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Today's Report - {format(new Date(), 'MMM dd, yyyy')}
              </span>
            </div>
            
            {/* Calculator Button */}
            <button
              onClick={() => setShowCalculator(true)}
              className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              title="Open Calculator"
            >
              <CalculatorIcon className="w-4 h-4" />
              <span>Calculator</span>
            </button>
          </div>
        </div>
      )}



      {/* Key Metrics - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sales</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {shopSettings.currency} {analytics.totalSales.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transactions</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{analytics.totalTransactions}</p>
            </div>
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Transaction</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {shopSettings.currency} {Math.round(analytics.avgTransactionValue).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">GRN Value</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {shopSettings.currency} {analytics.totalGRNValue.toLocaleString()}
              </p>
            </div>
            <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 dark:text-orange-400 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Returns Value</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {shopSettings.currency} {analytics.totalReturnsValue.toLocaleString()}
              </p>
            </div>
            <RotateCcw className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock Items</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{getLowStockProducts().length}</p>
            </div>
            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 dark:text-yellow-400 flex-shrink-0 ml-2" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Out of Stock Items</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{getOutOfStockProducts().length}</p>
            </div>
            <Package className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400 flex-shrink-0 ml-2" />
          </div>
        </div>

        {/* Total Inventory Value - Only visible to super_admin */}
        {canSeeInventoryValue && (
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('totalInventoryValue')}</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {shopSettings.currency} {analytics.totalInventoryValue.toLocaleString()}
                </p>
              </div>
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400 flex-shrink-0 ml-2" />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Selling Products */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('topSellingProducts')}</h3>
          <div className="space-y-3">
            {analytics.topProducts.slice(0, 5).map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{product.quantity} units sold</p>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white flex-shrink-0 ml-2">
                  {shopSettings.currency} {Math.round(product.revenue).toLocaleString()}
                </p>
              </div>
            ))}
            {analytics.topProducts.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No sales data available</p>
            )}
          </div>
        </div>

        {/* Low Selling Products */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('lowSellingProducts')}</h3>
          <div className="space-y-3">
            {analytics.lowSellingProducts.slice(0, 5).map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{product.quantity} units sold</p>
                </div>
                <p className="font-semibold text-gray-900 dark:text-white flex-shrink-0 ml-2">
                  {shopSettings.currency} {Math.round(product.revenue).toLocaleString()}
                </p>
              </div>
            ))}
            {analytics.lowSellingProducts.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No sales data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Cashier Sales Performance */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('cashierPerformance')}</h3>
        <div className="space-y-3">
          {analytics.cashierSalesArray.slice(0, 5).map((cashier, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white truncate">{cashier.name || cashier.email}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {cashier.role.toUpperCase()} • {cashier.totalTransactions} transactions • 
                  {cashier.totalProductsSold} products sold
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Avg: {shopSettings.currency} {Math.round(cashier.avgTransactionValue).toLocaleString()}
                </p>
              </div>
              <p className="font-semibold text-gray-900 dark:text-white flex-shrink-0 ml-2">
                {shopSettings.currency} {Math.round(cashier.totalSales).toLocaleString()}
              </p>
            </div>
          ))}
          {analytics.cashierSalesArray.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No sales data available</p>
          )}
        </div>
      </div>

      {/* Recent Transactions - Mobile Responsive Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('Recent Transactions')}</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            {filteredBills.map((bill) => (
              <div key={bill.id} className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">#{bill.billNumber}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {format(new Date(bill.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {shopSettings.currency} {bill.total.toLocaleString()}
                  </p>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <p>{t('customer')}: {bill.customer.name || t('walkInCustomer')}</p>
                  <p>{t('items')}: {bill.items.length} • {t('payment')}: {bill.payment.method.replace('_', ' ')}</p>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <p className="font-medium mb-1">{t('productsPurchased')}:</p>
                  <p>{bill.items.map(item => `${item.name} (${t('qty')}: ${item.quantity})`).join(', ')}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewBill(bill)}
                    className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>{t('view')}</span>
                  </button>
                  <button
                    onClick={() => handlePrintBill(bill)}
                    className="flex items-center space-x-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{t('print')}</span>
                  </button>
                  {isAdmin() && (
                    <button
                      onClick={() => setDeleteConfirm(bill.id)}
                      className="flex items-center space-x-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{t('delete')}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <table className="hidden sm:table min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('billNumber')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('dateTime')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('customer')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('items')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('products')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('total')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('payment')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredBills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    #{bill.billNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {format(new Date(bill.createdAt), 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {bill.customer.name || t('walkInCustomer')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {bill.items.length} {t('items').toLowerCase()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    <div className="max-w-xs">
                      <div className="font-medium text-xs text-gray-500 dark:text-gray-400 mb-1">{t('products')}:</div>
                      <div className="text-xs max-h-16 overflow-y-auto" title={bill.items.map(item => `${item.name} (${t('qty')}: ${item.quantity})`).join(', ')}>
                        {bill.items.map((item, index) => (
                          <div key={index} className="truncate">
                            {item.name} <span className="text-gray-500 dark:text-gray-400">({t('qty')}: {item.quantity})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {shopSettings.currency} {bill.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white capitalize">
                    {bill.payment.method.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewBill(bill)}
                        className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        title={t('viewDetails')}
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden lg:inline">{t('view')}</span>
                      </button>
                      
                      <button
                        onClick={() => handlePrintBill(bill)}
                        className="flex items-center space-x-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                        title={t('printBill')}
                      >
                        <Printer className="w-4 h-4" />
                        <span className="hidden lg:inline">{t('print')}</span>
                      </button>
                      
                      {isAdmin() && (
                        <button
                          onClick={() => setDeleteConfirm(bill.id)}
                          className="flex items-center space-x-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden lg:inline">Delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredBills.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No transactions found for the selected period</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent GRNs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Recent GRNs</h3>
        </div>
        <div className="max-h-80 overflow-y-auto">
          <div className="space-y-3 p-4 sm:p-6">
            {filteredGRNs.map((grn) => (
              <div key={grn.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{grn.grnNumber}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{grn.supplier}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="font-semibold text-gray-900 dark:text-white flex-shrink-0">
                      {shopSettings.currency} {Math.round(grn.totalValue).toLocaleString()}
                    </p>
                    <button
                      onClick={() => setSelectedGRN(grn)}
                      className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">View</span>
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p className="mb-1 truncate">Products: {grn.items.map(item => `${item.name} (${item.quantity})`).join(', ')}</p>
                  <p>Items: {grn.items.length} • Total Qty: {grn.items.reduce((sum, item) => sum + parseFloat(item.quantity), 0).toFixed(2)}</p>
                </div>
              </div>
            ))}
            {filteredGRNs.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No GRNs found for selected period</p>
            )}
          </div>
        </div>
      </div>

      {/* Draggable Calculator */}
      {showCalculator && (
        <Calculator
          isOpen={showCalculator}
          onClose={() => setShowCalculator(false)}
          isDraggable={true}
        />
      )}

      {/* Bill Details Modal */}
      {selectedBill && !showInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBill(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                {t('billDetails')} - #{selectedBill.billNumber}
              </h2>
              <button
                onClick={() => setSelectedBill(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {/* Bill Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">{t('billInformation')}</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-600 dark:text-gray-400">{t('date')}:</span> {format(new Date(selectedBill.createdAt), 'MMM dd, yyyy')}</p>
                    <p><span className="text-gray-600 dark:text-gray-400">{t('time')}:</span> {format(new Date(selectedBill.createdAt), 'HH:mm:ss')}</p>
                    <p><span className="text-gray-600 dark:text-gray-400">{t('cashier')}:</span> {selectedBill.cashier.name || selectedBill.cashier.email}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">{t('customerInformation')}</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-600 dark:text-gray-400">{t('name')}:</span> {selectedBill.customer.name || t('walkInCustomer')}</p>
                    <p><span className="text-gray-600 dark:text-gray-400">{t('phone')}:</span> {selectedBill.customer.phone || 'N/A'}</p>
                    <p><span className="text-gray-600 dark:text-gray-400">{t('email')}:</span> {selectedBill.customer.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('items')}</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('item')}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('qty')}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('price')}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('total')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedBill.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{shopSettings.currency} {item.price.toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{shopSettings.currency} {(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{t('subtotal')}:</span>
                      <span className="text-gray-900 dark:text-white">{shopSettings.currency} {selectedBill.subtotal.toLocaleString()}</span>
                    </div>
                    {selectedBill.discount.amount > 0 && (
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>{t('discount')}:</span>
                        <span>-{shopSettings.currency} {selectedBill.discount.amount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-600 pt-2">
                      <span className="text-gray-900 dark:text-white">{t('total')}:</span>
                      <span className="text-gray-900 dark:text-white">{shopSettings.currency} {selectedBill.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>{t('paymentMethod')}:</span>
                      <span className="capitalize">{selectedBill.payment.method.replace('_', ' ')}</span>
                    </div>
                    {selectedBill.payment.method === 'cash' && (
                      <>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>{t('amountPaid')}:</span>
                          <span>{shopSettings.currency} {selectedBill.payment.amountPaid.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>{t('change')}:</span>
                          <span>{shopSettings.currency} {selectedBill.payment.change.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSelectedBill(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  {t('close')}
                </button>
                <button
                  onClick={() => handlePrintBill(selectedBill)}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t('printBill')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Invoice Modal */}
      {showInvoice && selectedBill && (
        <InvoicePrint
          bill={selectedBill}
          onClose={() => {
            setShowInvoice(false);
            setSelectedBill(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg max-w-sm w-full border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Confirm Delete</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this bill? This action cannot be undone and will permanently remove the transaction record.
            </p>
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBill(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRN View Modal */}
      {selectedGRN && (
        <GRNView
          grn={selectedGRN}
          onClose={() => setSelectedGRN(null)}
        />
      )}
    </div>
  );
};

export default Reports;