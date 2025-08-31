import React, { useState, useMemo, useEffect } from 'react';
import { useBilling } from '../../contexts/BillingContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useGRN } from '../../contexts/GRNContext';
import { useReturns } from '../../contexts/ReturnsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useShop } from '../../contexts/ShopContext';
import { useMultiShop } from '../../contexts/MultiShopContext';
import { useTranslation } from 'react-i18next';
import { Download, FileSpreadsheet, FileText, TrendingUp, BarChart3, Package, DollarSign, Truck, RotateCcw } from 'lucide-react';
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { generateId } from '../../services/localStorage';

const MultiShopReport = ({ dateRange, customStartDate, customEndDate, isEnabled, onToggle }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [allShopsData, setAllShopsData] = useState({});
  const [aggregatedData, setAggregatedData] = useState(null);
  
  const { bills } = useBilling();
  const { products } = useInventory();
  const { grns } = useGRN();
  const { returns } = useReturns();
  const { isSuperAdmin, isShopAdmin } = useAuth();
  const { shopSettings } = useShop();
  const { shops, getShopCollection } = useMultiShop();
  const { t } = useTranslation();

  // Check if user can access multi-shop reports - Only super_admin
  const canAccessMultiShopReports = isSuperAdmin() && shops && shops.length > 1;

  // Get date range for filtering
  const getDateRange = () => {
    const now = new Date();
    
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      return {
        start: startOfDay(new Date(customStartDate)),
        end: endOfDay(new Date(customEndDate))
      };
    }
    
    // Default to today if not custom
    return { start: startOfDay(now), end: endOfDay(now) };
  };

  // Fetch data from all shops
  const fetchAllShopsData = async () => {
    if (!isEnabled || !canAccessMultiShopReports) {
      console.log('Multi-shop report disabled or access denied:', { 
        isEnabled, 
        canAccessMultiShopReports, 
        isSuperAdmin: isSuperAdmin(), 
        isShopAdmin: isShopAdmin(),
        shopsLength: shops?.length 
      });
      return;
    }

    if (!shops || shops.length === 0) {
      console.log('No shops available:', shops);
      return;
    }

    console.log('Starting multi-shop data fetch for', shops.length, 'shops');
    setIsLoading(true);
    
    try {
      const { start, end } = getDateRange();
      console.log('Date range:', { start, end, dateRange, customStartDate, customEndDate });
      
      const shopsData = {};

      for (const shop of shops) {
        try {
          // Get all data from localStorage and filter by shop
          const allBills = JSON.parse(localStorage.getItem('pos_bills') || '[]');
          const allProducts = JSON.parse(localStorage.getItem('pos_products') || '[]');
          const allGRNs = JSON.parse(localStorage.getItem('pos_grn') || '[]');
          const allReturns = JSON.parse(localStorage.getItem('pos_returns') || '[]');

          // Filter bills by shop and date range
          const shopBills = allBills.filter(bill => {
            if (!bill.shopId || bill.shopId !== shop.id) return false;
            if (!bill.createdAt) return false;
            const billDate = new Date(bill.createdAt);
            return isWithinInterval(billDate, { start, end });
          });

          // Filter products by shop
          const shopProducts = allProducts.filter(product => product.shopId === shop.id);

          // Filter GRNs by shop and date range
          const shopGRNs = allGRNs.filter(grn => {
            if (!grn.shopId || grn.shopId !== shop.id) return false;
            if (!grn.createdAt) return false;
            const grnDate = new Date(grn.createdAt);
            return isWithinInterval(grnDate, { start, end });
          });

          // Filter returns by shop and date range
          const shopReturns = allReturns.filter(returnItem => {
            if (!returnItem.shopId || returnItem.shopId !== shop.id) return false;
            if (!returnItem.createdAt) return false;
            const returnDate = new Date(returnItem.createdAt);
            return isWithinInterval(returnDate, { start, end });
          });

          shopsData[shop.id] = {
            shop,
            bills: shopBills,
            products: shopProducts,
            grns: shopGRNs,
            returns: shopReturns,
            analytics: calculateShopAnalytics(shopBills, shopProducts, shopGRNs, shopReturns)
          };

          console.log(`Fetched data for ${shop.name}:`, {
            bills: shopBills.length,
            products: shopProducts.length,
            grns: shopGRNs.length,
            returns: shopReturns.length
          });

        } catch (error) {
          console.error(`Error fetching data for shop ${shop.name}:`, error);
          // Continue with other shops even if one fails
          shopsData[shop.id] = {
            shop,
            bills: [],
            products: [],
            grns: [],
            returns: [],
            analytics: calculateShopAnalytics([], [], [], [])
          };
        }
      }

      console.log('All shops data:', shopsData);
      setAllShopsData(shopsData);
      setAggregatedData(calculateAggregatedAnalytics(shopsData));
    } catch (error) {
      console.error('Error fetching multi-shop data:', error);
      toast.error('Failed to fetch multi-shop data');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate analytics for a single shop
  const calculateShopAnalytics = (bills, products, grns, returns) => {
    const totalSales = bills.reduce((sum, bill) => sum + bill.total, 0);
    const totalTransactions = bills.length;
    const avgTransactionValue = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    
    const totalGRNValue = grns.reduce((sum, grn) => {
      return sum + (grn.items?.reduce((itemSum, item) => itemSum + (item.quantity * item.unitPrice), 0) || 0);
    }, 0);
    
    const totalReturnsValue = returns.reduce((sum, returnItem) => sum + (returnItem.totalValue || 0), 0);
    
    const totalInventoryValue = products.reduce((sum, product) => {
      return sum + (product.quantity * product.price);
    }, 0);

    const lowStockProducts = products.filter(product => 
      product.quantity <= (product.lowStockThreshold || 5)
    );
    
    const outOfStockProducts = products.filter(product => product.quantity <= 0);

    // Top selling products
    const productSales = {};
    bills.forEach(bill => {
      bill.items?.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.productId].quantity += parseFloat(item.quantity);
        productSales[item.productId].revenue += parseFloat(item.quantity) * parseFloat(item.price);
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalSales,
      totalTransactions,
      avgTransactionValue,
      totalGRNValue,
      totalGRNs: grns.length,
      totalReturnsValue,
      totalReturns: returns.length,
      totalInventoryValue,
      lowStockProducts: lowStockProducts.length,
      outOfStockProducts: outOfStockProducts.length,
      totalProducts: products.length,
      topProducts
    };
  };

  // Calculate aggregated analytics across all shops
  const calculateAggregatedAnalytics = (shopsData) => {
    const shopAnalytics = Object.values(shopsData).map(shop => shop.analytics);
    
    return {
      totalSales: shopAnalytics.reduce((sum, analytics) => sum + analytics.totalSales, 0),
      totalTransactions: shopAnalytics.reduce((sum, analytics) => sum + analytics.totalTransactions, 0),
      totalGRNValue: shopAnalytics.reduce((sum, analytics) => sum + analytics.totalGRNValue, 0),
      totalGRNs: shopAnalytics.reduce((sum, analytics) => sum + analytics.totalGRNs, 0),
      totalReturnsValue: shopAnalytics.reduce((sum, analytics) => sum + analytics.totalReturnsValue, 0),
      totalReturns: shopAnalytics.reduce((sum, analytics) => sum + analytics.totalReturns, 0),
      totalInventoryValue: shopAnalytics.reduce((sum, analytics) => sum + analytics.totalInventoryValue, 0),
      totalLowStockProducts: shopAnalytics.reduce((sum, analytics) => sum + analytics.lowStockProducts, 0),
      totalOutOfStockProducts: shopAnalytics.reduce((sum, analytics) => sum + analytics.outOfStockProducts, 0),
      totalProducts: shopAnalytics.reduce((sum, analytics) => sum + analytics.totalProducts, 0),
      avgTransactionValue: shopAnalytics.reduce((sum, analytics) => sum + analytics.totalSales, 0) / 
                          Math.max(shopAnalytics.reduce((sum, analytics) => sum + analytics.totalTransactions, 0), 1)
    };
  };

  // Fetch data when enabled and date range changes
  useEffect(() => {
    if (isEnabled && canAccessMultiShopReports) {
      fetchAllShopsData();
    }
  }, [isEnabled, dateRange, customStartDate, customEndDate]);

  // Export to Excel
  const exportMultiShopExcel = () => {
    if (!aggregatedData || Object.keys(allShopsData).length === 0) {
      toast.error('No data available for export');
      return;
    }

    const wb = XLSX.utils.book_new();
    const { start, end } = getDateRange();

    // Executive Summary Sheet
    const execSummaryData = [
      ['MULTI-SHOP COMPREHENSIVE BUSINESS REPORT'],
      [''],
      ['Report Period:', `${format(start, 'yyyy-MM-dd')} to ${format(end, 'yyyy-MM-dd')}`],
      ['Generated On:', format(new Date(), 'yyyy-MM-dd HH:mm:ss')],
      ['Total Shops Analyzed:', Object.keys(allShopsData).length],
      [''],
      ['EXECUTIVE SUMMARY - ALL SHOPS'],
      ['Metric', 'Value'],
      ['Total Sales Revenue', `${shopSettings.currency} ${aggregatedData.totalSales.toLocaleString()}`],
      ['Total Transactions', aggregatedData.totalTransactions],
      ['Average Transaction Value', `${shopSettings.currency} ${Math.round(aggregatedData.avgTransactionValue).toLocaleString()}`],
      ['Total GRN Value', `${shopSettings.currency} ${aggregatedData.totalGRNValue.toLocaleString()}`],
      ['Total GRNs Created', aggregatedData.totalGRNs],
      ['Total Returns Value', `${shopSettings.currency} ${aggregatedData.totalReturnsValue.toLocaleString()}`],
      ['Total Returns', aggregatedData.totalReturns],
      ...(isSuperAdmin() ? [['Total Inventory Value', `${shopSettings.currency} ${aggregatedData.totalInventoryValue.toLocaleString()}`]] : []),
      ['Total Low Stock Items', aggregatedData.totalLowStockProducts],
      ['Total Out of Stock Items', aggregatedData.totalOutOfStockProducts],
      ['Total Products in System', aggregatedData.totalProducts],
    ];

    const execSummaryWS = XLSX.utils.aoa_to_sheet(execSummaryData);
    execSummaryWS['!cols'] = [{ width: 30 }, { width: 25 }];
    XLSX.utils.book_append_sheet(wb, execSummaryWS, 'Executive Summary');

    // Shop Comparison Sheet
    const comparisonData = [
      ['SHOP PERFORMANCE COMPARISON'],
      [''],
      ['Shop Name', 'Location', 'Total Sales', 'Transactions', 'Avg Transaction', 'GRN Value', 'Returns Value', 'Products', 'Low Stock', 'Out of Stock']
    ];

    Object.values(allShopsData).forEach(shopData => {
      const { shop, analytics } = shopData;
      comparisonData.push([
        shop.name,
        shop.address || 'N/A',
        `${shopSettings.currency} ${analytics.totalSales.toLocaleString()}`,
        analytics.totalTransactions,
        `${shopSettings.currency} ${Math.round(analytics.avgTransactionValue).toLocaleString()}`,
        `${shopSettings.currency} ${analytics.totalGRNValue.toLocaleString()}`,
        `${shopSettings.currency} ${analytics.totalReturnsValue.toLocaleString()}`,
        analytics.totalProducts,
        analytics.lowStockProducts,
        analytics.outOfStockProducts
      ]);
    });

    const comparisonWS = XLSX.utils.aoa_to_sheet(comparisonData);
    comparisonWS['!cols'] = [
      { width: 20 }, { width: 25 }, { width: 15 }, { width: 12 }, 
      { width: 15 }, { width: 15 }, { width: 15 }, { width: 10 }, 
      { width: 10 }, { width: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, comparisonWS, 'Shop Comparison');

    // Individual shop detailed sheets
    Object.values(allShopsData).forEach(shopData => {
      const { shop, bills, analytics } = shopData;
      const shopSheetData = [
        [`DETAILED REPORT - ${shop.name.toUpperCase()}`],
        [''],
        ['Shop Information'],
        ['Name:', shop.name],
        ['Address:', shop.address || 'N/A'],
        ['Phone:', shop.phone || 'N/A'],
        [''],
        ['Performance Metrics'],
        ['Metric', 'Value'],
        ['Total Sales Revenue', `${shopSettings.currency} ${analytics.totalSales.toLocaleString()}`],
        ['Total Transactions', analytics.totalTransactions],
        ['Average Transaction Value', `${shopSettings.currency} ${Math.round(analytics.avgTransactionValue).toLocaleString()}`],
        ['Total GRN Value', `${shopSettings.currency} ${analytics.totalGRNValue.toLocaleString()}`],
        ['Total Returns Value', `${shopSettings.currency} ${analytics.totalReturnsValue.toLocaleString()}`],
        ['Total Products', analytics.totalProducts],
        ['Low Stock Items', analytics.lowStockProducts],
        ['Out of Stock Items', analytics.outOfStockProducts],
        [''],
        ['Top Selling Products'],
        ['Rank', 'Product Name', 'Quantity Sold', 'Revenue'],
        ...analytics.topProducts.map((product, index) => [
          index + 1,
          product.name,
          product.quantity,
          `${shopSettings.currency} ${Math.round(product.revenue).toLocaleString()}`
        ]),
        [''],
        ['Recent Transactions'],
        ['Bill Number', 'Date', 'Customer', 'Total', 'Payment Method'],
        ...bills.slice(0, 20).map(bill => [
          bill.billNumber,
          format(new Date(bill.createdAt), 'yyyy-MM-dd HH:mm'),
          bill.customer.name || 'Walk-in',
          `${shopSettings.currency} ${bill.total.toLocaleString()}`,
          bill.payment.method
        ])
      ];

      const shopWS = XLSX.utils.aoa_to_sheet(shopSheetData);
      shopWS['!cols'] = [{ width: 20 }, { width: 25 }, { width: 15 }, { width: 15 }, { width: 15 }];
      
      // Sanitize sheet name (Excel has restrictions)
      const sanitizedShopName = shop.name.replace(/[\\/:*?"<>|]/g, '').substring(0, 31);
      XLSX.utils.book_append_sheet(wb, shopWS, sanitizedShopName);
    });

    // Save the file
    const fileName = `multi-shop-comprehensive-report-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success('Multi-shop Excel report generated successfully!');
  };

  // Export to PDF
  const exportMultiShopPDF = () => {
    if (!aggregatedData || Object.keys(allShopsData).length === 0) {
      toast.error('No data available for export');
      return;
    }

    const doc = new jsPDF();
    const { start, end } = getDateRange();
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.text('Multi-Shop Comprehensive Business Report', 20, yPosition);
    yPosition += 15;

    // Report info
    doc.setFontSize(12);
    doc.text(`Report Period: ${format(start, 'yyyy-MM-dd')} to ${format(end, 'yyyy-MM-dd')}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Generated On: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Total Shops Analyzed: ${Object.keys(allShopsData).length}`, 20, yPosition);
    yPosition += 15;

    // Executive Summary
    doc.setFontSize(16);
    doc.text('EXECUTIVE SUMMARY - ALL SHOPS', 20, yPosition);
    yPosition += 10;

    const execSummaryData = [
      ['Metric', 'Value'],
      ['Total Sales Revenue', `${shopSettings.currency} ${aggregatedData.totalSales.toLocaleString()}`],
      ['Total Transactions', aggregatedData.totalTransactions.toString()],
      ['Average Transaction Value', `${shopSettings.currency} ${Math.round(aggregatedData.avgTransactionValue).toLocaleString()}`],
      ['Total GRN Value', `${shopSettings.currency} ${aggregatedData.totalGRNValue.toLocaleString()}`],
      ['Total Returns Value', `${shopSettings.currency} ${aggregatedData.totalReturnsValue.toLocaleString()}`],
      ...(isSuperAdmin() ? [['Total Inventory Value', `${shopSettings.currency} ${aggregatedData.totalInventoryValue.toLocaleString()}`]] : []),
      ['Total Products', aggregatedData.totalProducts.toString()],
      ['Low Stock Items', aggregatedData.totalLowStockProducts.toString()],
      ['Out of Stock Items', aggregatedData.totalOutOfStockProducts.toString()],
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [execSummaryData[0]],
      body: execSummaryData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 10 },
      margin: { left: 20, right: 20 }
    });

    // Add new page for shop comparison
    doc.addPage();
    yPosition = 20;

    doc.setFontSize(16);
    doc.text('SHOP PERFORMANCE COMPARISON', 20, yPosition);
    yPosition += 10;

    const comparisonData = [
      ['Shop Name', 'Sales', 'Transactions', 'Avg Transaction'],
      ...Object.values(allShopsData).map(shopData => [
        shopData.shop.name,
        `${shopSettings.currency} ${shopData.analytics.totalSales.toLocaleString()}`,
        shopData.analytics.totalTransactions.toString(),
        `${shopSettings.currency} ${Math.round(shopData.analytics.avgTransactionValue).toLocaleString()}`
      ])
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [comparisonData[0]],
      body: comparisonData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
      styles: { fontSize: 9 },
      margin: { left: 20, right: 20 }
    });

    // Individual shop summaries (one per page if many shops)
    Object.values(allShopsData).forEach((shopData, index) => {
      if (index > 0 || doc.lastAutoTable.finalY > 200) {
        doc.addPage();
        yPosition = 20;
      } else {
        yPosition = doc.lastAutoTable.finalY + 20;
      }

      const { shop, analytics } = shopData;
      
      doc.setFontSize(16);
      doc.text(`${shop.name.toUpperCase()} - DETAILED SUMMARY`, 20, yPosition);
      yPosition += 15;

      const shopData_table = [
        ['Metric', 'Value'],
        ['Total Sales', `${shopSettings.currency} ${analytics.totalSales.toLocaleString()}`],
        ['Transactions', analytics.totalTransactions.toString()],
        ['Average Transaction', `${shopSettings.currency} ${Math.round(analytics.avgTransactionValue).toLocaleString()}`],
        ['GRN Value', `${shopSettings.currency} ${analytics.totalGRNValue.toLocaleString()}`],
        ['Returns Value', `${shopSettings.currency} ${analytics.totalReturnsValue.toLocaleString()}`],
        ['Products', analytics.totalProducts.toString()],
        ['Low Stock', analytics.lowStockProducts.toString()],
        ['Out of Stock', analytics.outOfStockProducts.toString()]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [shopData_table[0]],
        body: shopData_table.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [168, 85, 247] },
        styles: { fontSize: 9 },
        margin: { left: 20, right: 20 }
      });

      // Top products for this shop
      if (analytics.topProducts.length > 0) {
        yPosition = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text('Top Selling Products:', 20, yPosition);
        yPosition += 5;

        const topProductsData = [
          ['Product', 'Qty Sold', 'Revenue'],
          ...analytics.topProducts.slice(0, 3).map(product => [
            product.name.substring(0, 25),
            product.quantity.toString(),
            `${shopSettings.currency} ${Math.round(product.revenue).toLocaleString()}`
          ])
        ];

        autoTable(doc, {
          startY: yPosition,
          head: [topProductsData[0]],
          body: topProductsData.slice(1),
          theme: 'striped',
          styles: { fontSize: 8 },
          margin: { left: 20, right: 20 }
        });
      }
    });

    // Save the PDF
    const fileName = `multi-shop-comprehensive-report-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.pdf`;
    doc.save(fileName);
    toast.success('Multi-shop PDF report generated successfully!');
  };

  if (!canAccessMultiShopReports) {
    // Show a message if user has permission but not enough shops
    if ((isSuperAdmin() || isShopAdmin()) && (!shops || shops.length <= 1)) {
      return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Multi-shop reports require at least 2 shops to generate comparative analysis.
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center justify-between">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="multiShopReport"
            checked={isEnabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="multiShopReport" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Generate Multi-Shop Comprehensive Report
          </label>
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </div>

        {isEnabled && aggregatedData && (
          <div className="flex space-x-2">
            <button
              onClick={exportMultiShopExcel}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel</span>
            </button>
            <button
              onClick={exportMultiShopPDF}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <FileText className="w-4 h-4" />
              <span>PDF</span>
            </button>
          </div>
        )}
      </div>

      {isEnabled && aggregatedData && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Multi-Shop Summary ({Object.keys(allShopsData).length} Shops)
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Sales</p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {shopSettings.currency} {aggregatedData.totalSales.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">Total Transactions</p>
                  <p className="text-lg font-bold text-green-900 dark:text-green-100">
                    {aggregatedData.totalTransactions}
                  </p>
                </div>
                <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-400">Avg Transaction</p>
                  <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                    {shopSettings.currency} {Math.round(aggregatedData.avgTransactionValue).toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Total Products</p>
                  <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                    {aggregatedData.totalProducts}
                  </p>
                </div>
                <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          {/* Shop Performance Comparison */}
          <div className="mt-6">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Shop Performance Comparison</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Shop</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sales</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Transactions</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Avg Transaction</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Products</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {Object.values(allShopsData).map((shopData, index) => (
                    <tr key={shopData.shop.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">{shopData.shop.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                        {shopSettings.currency} {shopData.analytics.totalSales.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{shopData.analytics.totalTransactions}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">
                        {shopSettings.currency} {Math.round(shopData.analytics.avgTransactionValue).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">{shopData.analytics.totalProducts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiShopReport;
