import React, { useState } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { useBilling } from '../../contexts/BillingContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useShop } from '../../contexts/ShopContext';
import { format, startOfDay, endOfDay, subDays, isWithinInterval } from 'date-fns';
import { 
  Package, 
  Receipt, 
  AlertTriangle, 
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import SalesChart from './SalesChart';

// Smart number formatting function
const formatQuantity = (value) => {
  const num = parseFloat(value) || 0;
  // If it's a whole number, show as integer
  if (num % 1 === 0) {
    return num.toString();
  }
  // If it has decimals, show up to 3 decimal places, removing trailing zeros
  return parseFloat(num.toFixed(3)).toString();
};

const DashboardHome = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { products, getLowStockProducts, getOutOfStockProducts } = useInventory();
  const { bills } = useBilling();
  const { shopSettings } = useShop();
  const { isSuperAdmin, isShopAdmin, isCashier } = useAuth();
  const { t } = useTranslation();

  // Check if user can view different dates (only super_admin and shop_admin)
  const canChangeDates = isSuperAdmin() || isShopAdmin();

  const lowStockProducts = getLowStockProducts();
  const outOfStockProducts = getOutOfStockProducts();
  
  // Filter bills by selected date (cashiers can only see today's data)
  const effectiveDate = canChangeDates ? selectedDate : new Date();
  const selectedDateBills = bills.filter(bill => {
    const billDate = new Date(bill.createdAt);
    const start = startOfDay(effectiveDate);
    const end = endOfDay(effectiveDate);
    return isWithinInterval(billDate, { start, end });
  });

  const todaysRevenue = selectedDateBills.reduce((total, bill) => total + bill.total, 0);

  const stats = [
    {
      name: 'Total Products',
      value: products.length,
      icon: Package,
      color: 'blue'
    },
    {
      name: 'Low Stock Items',
      value: lowStockProducts.length,
      icon: AlertTriangle,
      color: 'yellow'
    },
    {
      name: 'Out of Stock Items',
      value: outOfStockProducts.length,
      icon: Package,
      color: 'red'
    },
    {
      name: `${format(effectiveDate, 'MMM dd')} Sales`,
      value: selectedDateBills.length,
      icon: Receipt,
      color: 'green'
    },
    {
      name: `${format(effectiveDate, 'MMM dd')} Revenue`,
      value: `${shopSettings.currency} ${todaysRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'purple'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      red: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
      green: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
      purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800'
    };
    return colors[color] || colors.blue;
  };

  // Helper function to format items sold
  const formatItemsSold = (items) => {
    if (items.length === 0) return 'No items';
    if (items.length === 1) return `${items[0].name} (${items[0].quantity})`;
    if (items.length === 2) return `${items[0].name} (${items[0].quantity}), ${items[1].name} (${items[1].quantity})`;
    
    const firstTwo = items.slice(0, 2);
    const remaining = items.length - 2;
    return `${firstTwo[0].name} (${firstTwo[0].quantity}), ${firstTwo[1].name} (${firstTwo[1].quantity}) +${remaining} more`;
  };

  const goToPreviousDay = () => {
    if (!canChangeDates) return;
    setSelectedDate(subDays(selectedDate, 1));
  };

  const goToNextDay = () => {
    if (!canChangeDates) return;
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const today = new Date();
    
    // Don't allow going beyond today
    if (nextDay <= today) {
      setSelectedDate(nextDay);
    }
  };

  const goToToday = () => {
    if (!canChangeDates) return;
    setSelectedDate(new Date());
  };

  const isToday = format(effectiveDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const isYesterday = format(effectiveDate, 'yyyy-MM-dd') === format(subDays(new Date(), 1), 'yyyy-MM-dd');

  const getDateDisplayText = () => {
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    return format(effectiveDate, 'MMM dd, yyyy');
  };

  return (
    <div className="space-y-mobile">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
          {t('dashboard')}
        </h1>
        <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
          Overview of your business performance
        </p>
      </div>

      {/* Stats Grid - Responsive: 3 blocks top, 2 blocks bottom */}
      <div className="space-y-4">
        {/* Top row - 3 blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.slice(0, 3).map((stat, index) => (
            <div
              key={index}
              className={`p-4 lg:p-6 rounded-lg border-2 ${getColorClasses(stat.color)}`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs lg:text-sm font-medium opacity-80 truncate">{stat.name}</p>
                  <p className="text-lg lg:text-2xl font-bold truncate">{stat.value}</p>
                </div>
                <stat.icon className="w-6 h-6 lg:w-8 lg:h-8 opacity-80 flex-shrink-0 ml-2" />
              </div>
            </div>
          ))}
        </div>
        
        {/* Bottom row - 2 blocks centered */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {stats.slice(3, 5).map((stat, index) => (
            <div
              key={index + 3}
              className={`p-4 lg:p-6 rounded-lg border-2 ${getColorClasses(stat.color)}`}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs lg:text-sm font-medium opacity-80 truncate">{stat.name}</p>
                  <p className="text-lg lg:text-2xl font-bold truncate">{stat.value}</p>
                </div>
                <stat.icon className="w-6 h-6 lg:w-8 lg:h-8 opacity-80 flex-shrink-0 ml-2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sales Analytics Chart */}
      <div className="card-mobile">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white">{getDateDisplayText()}'s Sales Analytics</h3>
        </div>
        <SalesChart bills={selectedDateBills} />
      </div>

      {/* Quick Actions - Responsive Grid */}
      <div className="grid-responsive cols-2-lg">
        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div className="card-mobile border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white">Low Stock Alert</h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex justify-between items-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 mr-2">{product.name}</span>
                  <span className="text-sm text-yellow-700 dark:text-yellow-400 flex-shrink-0">{formatQuantity(product.quantity)} left</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Out of Stock Alert */}
        {outOfStockProducts.length > 0 && (
          <div className="card-mobile border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2 mb-4">
              <Package className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white">Out of Stock Alert</h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {outOfStockProducts.map((product) => (
                <div key={product.id} className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 mr-2">{product.name}</span>
                  <span className="text-sm text-red-700 dark:text-red-400 flex-shrink-0">Out of Stock</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Sales with Date Navigation */}
        <div className="card-mobile">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 space-y-2 lg:space-y-0">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white">Sales</h3>
            </div>
            
            {/* Date Navigation - Only visible for super_admin and shop_admin */}
            {canChangeDates && (
              <div className="flex items-center justify-between lg:justify-end space-x-2">
                <button
                  onClick={goToPreviousDay}
                  className="btn-touch p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Previous day"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[100px] text-center">
                    {getDateDisplayText()}
                  </span>
                </div>
                
                <button
                  onClick={goToNextDay}
                  disabled={isToday}
                  className="btn-touch p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next day"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
                
                {!isToday && (
                  <button
                    onClick={goToToday}
                    className="btn-touch px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    Today
                  </button>
                )}
              </div>
            )}
            
            {/* Date Display Only for Cashiers */}
            {!canChangeDates && (
              <div className="flex items-center justify-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Today's Sales
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-3 max-h-64 lg:max-h-80 overflow-y-auto">
            {selectedDateBills.slice(0, 10).map((bill) => (
              <div key={bill.id} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-2 lg:space-y-0 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">#{bill.billNumber}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span className="font-medium">Items sold:</span> 
                      <span className="block lg:inline lg:ml-1">{formatItemsSold(bill.items)}</span>
                    </div>
                    {bill.customer.name && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Customer: {bill.customer.name}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                      {shopSettings.currency} {bill.total.toLocaleString()}
                    </span>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {bill.items.reduce((sum, item) => sum + parseFloat(item.quantity), 0).toFixed(2)} units
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {selectedDateBills.length === 0 && (
              <div className="text-center py-4">
                <ShoppingCart className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No sales on {getDateDisplayText().toLowerCase()}
                </p>
              </div>
            )}
            {selectedDateBills.length > 10 && (
              <div className="text-center py-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Showing 10 of {selectedDateBills.length} transactions
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;