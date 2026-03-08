/**
 * Main Application File for Retail Management System
 * 
 * This file handles UI management, inventory tracking, reports, and user interactions
 * for the retail management system with modern minimal design. The application features
 * Feather icons, and enhanced user experience elements.
 * 
 * What's included:
 * - InventoryManager: Tracks stock levels and sends alerts
 * - ReportsManager: Generates sales reports and analytics
 * - PromotionManager: Handles discount campaigns and special offers
 * - UIManager: Controls the modern minimal UI with enhanced action buttons
 * - Global CRUD functions: Handle all create, read, update, delete operations
 */

/**
 * Inventory Manager Class
 * 
 * Manages inventory levels, low stock alerts, and inventory statistics.
 */
class InventoryManager {
    /**
     * Initialize inventory manager
     * @param {DataStore} dataStore - Data store reference
     */
    constructor(dataStore) {
        this.dataStore = dataStore;
        this.lowStockThreshold = 10;
        this.notifications = [];
    }

    /**
     * Check for low stock products and create alerts
     * 
     * @returns {Array} Low stock notifications
     */
    checkLowStock() {
        const lowStockProducts = this.dataStore.getAllProducts().filter(product => 
            product.isLowStock()
        );

        this.notifications = lowStockProducts.map(product => ({
            id: `low-stock-${product.id}`,
            type: 'warning',  // I use this for styling the alert
            productId: product.id,  // So I know which product it's about
            productName: product.name,  // The name I want to display
            currentStock: product.stock,  // How many are left
            threshold: product.lowStockThreshold,  // The limit I set for this item
            message: `${product.name} is running low on stock (${product.stock} remaining)`,
            timestamp: new Date()  // When I generated this alert
        }));

        return this.notifications;
    }

    /**
     * I use this to find products that are completely sold out
     * 
     * @returns {Array} List of products with zero stock
     */
    getOutOfStockProducts() {
        return this.dataStore.getAllProducts().filter(product => product.stock === 0);
    }

    /**
     * This gives me a complete overview of my inventory situation
     * 
     * I made this to analyze all my products and get the key numbers I need
     * like stock levels, total values, and which items need attention.
     * 
     * @returns {Object} All the inventory stats I care about
     */
    getInventorySummary() {
        const products = this.dataStore.getAllProducts();
        
        // I separate products into different categories based on stock levels
        const lowStockProducts = products.filter(p => p.isLowStock() && p.stock > 0);
        const outOfStockProducts = products.filter(p => p.stock === 0);
        
        // I calculate how much my inventory is worth (price × quantity for everything)
        const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

        return {
            totalProducts: products.length,  // How many different products I have
            lowStockCount: lowStockProducts.length,  // How many are running low
            outOfStockCount: outOfStockProducts.length,  // How many are sold out
            totalInventoryValue: totalValue,  // Total dollar value of my stock
            lowStockProducts,  // The actual low stock items
            outOfStockProducts  // The sold out items
        };
    }

    /**
     * I use this when I need to update stock for multiple products at once
     * 
     * This is handy when I receive shipments or need to make bulk adjustments.
     * It tries to update each product and tells me what worked and what didn't.
     * 
     * @param {Array} updates - List of {productId, quantity} objects I want to update
     * @returns {Array} Results telling me if each update worked or not
     */
    bulkUpdateStock(updates) {
        const results = [];
        
        updates.forEach(update => {
            const product = this.dataStore.getProductById(update.productId);
            if (product) {
                // I try to update the stock (can add or remove inventory)
                const success = product.updateStock(update.quantity);
                results.push({
                    productId: update.productId,
                    success,  // Did the update work?
                    newStock: product.stock  // What's the stock level now?
                });
            }
        });
        
        return results;
    }
}

/**
 * Reports Manager Class
 * 
 * I built this class to generate all the sales reports and analytics I need.
 * It helps me understand my sales data, customer behavior, and which products are doing well.
 */
class ReportsManager {
    /**
     * Setting up my reports manager with access to all my data
     * @param {DataStore} dataStore - My main data store
     */
    constructor(dataStore) {
        this.dataStore = dataStore;
    }

    /**
     * This creates a complete sales summary report for me
     * 
     * I use this to see my key sales numbers like revenue, order counts,
     * and average order values. I can also filter it by date range if I want
     * to see specific time periods.
     * 
     * @param {Date|string|null} startDate - Optional start date for filtering
     * @param {Date|string|null} endDate - Optional end date for filtering
     * @returns {Object} Sales summary with key metrics
     */
    getSalesSummary(startDate = null, endDate = null) {
        let orders = this.dataStore.getAllOrders();

        // Apply date range filtering if dates are provided
        if (startDate || endDate) {
            orders = orders.filter(order => {
                const orderDate = new Date(order.orderDate);
                if (startDate && orderDate < new Date(startDate)) return false;
                if (endDate && orderDate > new Date(endDate)) return false;
                return true;
            });
        }

        // Filter orders by completion status for revenue calculations
        const completedOrders = orders.filter(order => 
            order.status === 'completed' || order.status === 'shipped'
        );
        
        // Calculate total revenue from completed orders only
        const totalRevenue = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        
        // Calculate average order value (avoid division by zero)
        const averageOrderValue = completedOrders.length > 0 ? 
            totalRevenue / completedOrders.length : 0;

        return {
            totalOrders: orders.length,  // All orders in the period
            completedOrders: completedOrders.length,  // Successfully completed orders
            pendingOrders: orders.filter(order => order.status === 'pending').length,
            cancelledOrders: orders.filter(order => order.status === 'cancelled').length,
            totalRevenue,  // Revenue from completed orders only
            averageOrderValue,  // Average value per completed order
            orders: completedOrders  // Array of completed order objects
        };
    }

    /**
     * Analyze and rank top-selling products by quantity sold
     * 
     * Examines all completed orders to determine which products are
     * selling best. Calculates both quantity sold and revenue generated
     * for each product and returns them ranked by sales volume.
     * 
     * @param {number} limit - Maximum number of top products to return (default: 5)
     * @returns {Array} Array of top products with sales statistics
     */
    getTopProducts(limit = 5) {
        // Map to accumulate sales data for each product
        const productSales = new Map();
        
        // Process all completed and shipped orders
        this.dataStore.getAllOrders()
            .filter(order => order.status === 'completed' || order.status === 'shipped')
            .forEach(order => {
                // Process each item in the order
                order.items.forEach(item => {
                    const current = productSales.get(item.productId) || { 
                        quantity: 0, 
                        revenue: 0 
                    };
                    
                    // Accumulate quantity and revenue for this product
                    current.quantity += item.quantity;
                    current.revenue += item.quantity * item.price;
                    productSales.set(item.productId, current);
                });
            });

        // Convert map to array and enrich with product information
        const topProducts = Array.from(productSales.entries())
            .map(([productId, sales]) => {
                const product = this.dataStore.getProductById(productId);
                return {
                    productId,
                    productName: product ? product.name : 'Unknown Product',
                    quantitySold: sales.quantity,  // Total units sold
                    revenue: sales.revenue,  // Total revenue generated
                    product  // Full product object for additional details
                };
            })
            .sort((a, b) => b.quantitySold - a.quantitySold)  // Sort by quantity (descending)
            .slice(0, limit);  // Limit to requested number of results

        return topProducts;
    }

    /**
     * Generate customer analytics and spending behavior analysis
     * 
     * Analyzes all customers to provide insights into their purchasing
     * behavior, including total spend, order frequency, and value metrics.
     * Useful for identifying high-value customers and purchase patterns.
     * 
     * @returns {Array} Array of customer analytics objects sorted by total spend
     */
    getCustomerAnalytics() {
        const customers = this.dataStore.getAllCustomers();
        const orders = this.dataStore.getAllOrders();

        // Generate analytics for each customer
        const customerStats = customers.map(customer => {
            // Get all orders for this customer
            const customerOrders = orders.filter(order => order.customerId === customer.id);
            
            // Filter to completed orders for revenue calculations
            const completedOrders = customerOrders.filter(order => 
                order.status === 'completed' || order.status === 'shipped'
            );
            
            // Calculate total amount spent by this customer
            const totalSpent = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);

            return {
                customerId: customer.id,
                customerName: customer.name,
                totalOrders: customerOrders.length,  // All orders (any status)
                completedOrders: completedOrders.length,  // Only completed orders
                totalSpent,  // Total revenue from this customer
                averageOrderValue: completedOrders.length > 0 ? 
                    totalSpent / completedOrders.length : 0  // Average per completed order
            };
        });

        // Sort customers by total spending (highest first)
        return customerStats.sort((a, b) => b.totalSpent - a.totalSpent);
    }

    /**
     * Generate monthly sales trend analysis
     * 
     * Groups completed orders by month to show sales trends over time.
     * Useful for identifying seasonal patterns and growth trends.
     * 
     * @returns {Array} Array of monthly data with order counts and revenue
     */
    getMonthlySalesTrend() {
        // Get all completed orders for trend analysis
        const orders = this.dataStore.getAllOrders()
            .filter(order => order.status === 'completed' || order.status === 'shipped');

        const monthlyData = {};
        
        // Group orders by month and accumulate data
        orders.forEach(order => {
            const date = new Date(order.orderDate);
            // Create month key in YYYY-MM format
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            // Initialize month data if not exists
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { orders: 0, revenue: 0 };
            }
            
            // Accumulate order count and revenue for this month
            monthlyData[monthKey].orders++;
            monthlyData[monthKey].revenue += order.totalAmount;
        });

        // Convert to array format and sort chronologically
        return Object.entries(monthlyData)
            .map(([month, data]) => ({ month, ...data }))
            .sort((a, b) => a.month.localeCompare(b.month));
    }
}

/**
 * Promotion Manager Class
 * 
 * Handles all aspects of promotional campaigns including validation,
 * application logic, and promotion-related calculations. Manages
 * active promotions and calculates savings for customers.
 */
class PromotionManager {
    /**
     * Initialize the promotion manager with data store reference
     * @param {DataStore} dataStore - Reference to the main data store
     */
    constructor(dataStore) {
        this.dataStore = dataStore;
    }

    /**
     * Get all currently active and valid promotions
     * 
     * Filters promotions to only return those that are currently
     * valid based on date ranges and active status.
     * 
     * @returns {Array} Array of active promotion objects
     */
    getActivePromotions() {
        return this.dataStore.getAllPromotions().filter(promo => promo.isValid());
    }

    /**
     * Get all promotions that have expired
     * 
     * @returns {Array} Array of expired promotion objects
     */
    getExpiredPromotions() {
        return this.dataStore.getAllPromotions().filter(promo => promo.isExpired());
    }

    /**
     * Find the best available promotion for a specific product
     * 
     * Searches through active promotions for the given product and
     * returns the one with the highest discount percentage.
     * 
     * @param {string} productId - ID of the product to check promotions for
     * @returns {Promotion|null} Best promotion object or null if none found
     */
    getBestPromotionForProduct(productId) {
        const promotions = this.getActivePromotions().filter(promo => 
            promo.productId === productId
        );
        
        if (promotions.length === 0) return null;

        // Return promotion with highest discount percentage
        return promotions.reduce((best, current) => 
            current.discountPercentage > best.discountPercentage ? current : best
        );
    }

    /**
     * Calculate total savings from promotions for a set of order items
     * 
     * Analyzes each item in an order to determine how much the customer
     * saves due to active promotions. Useful for showing savings on
     * order summaries and receipts.
     * 
     * @param {Array} items - Array of order items {productId, quantity}
     * @returns {number} Total savings amount from all applicable promotions
     */
    calculatePromotionSavings(items) {
        let totalSavings = 0;
        
        items.forEach(item => {
            const product = this.dataStore.getProductById(item.productId);
            const promotion = this.getBestPromotionForProduct(item.productId);
            
            if (product && promotion) {
                // Calculate savings: (original price - discounted price) × quantity
                const originalPrice = product.price * item.quantity;
                const discountedPrice = product.getCurrentPrice([promotion]) * item.quantity;
                totalSavings += originalPrice - discountedPrice;
            }
        });

        return totalSavings;
    }
}

/**
 * UI Manager
 * Handles all UI operations and event management for the modern minimal interface.
 * Features enhanced action buttons with Feather icons, responsive design, and clean layouts.
 */
class UIManager {
    constructor() {
        this.currentTab = 'dashboard';
        this.modals = {};
    }

    /**
     * Initialize the application
     */
    init() {
        // Initialize data
        dataStore = new DataStore();
        crudManager = new CRUDManager(dataStore);
        this.inventoryManager = new InventoryManager(dataStore);
        this.reportsManager = new ReportsManager(dataStore);
        this.promotionManager = new PromotionManager(dataStore);

        // Set up event listeners
        this.setupEventListeners();

        // Create modals
        this.createModals();

        // Initial UI update
        this.updateDashboard();
        this.updateAllTables();

        // Display current date
        document.getElementById('current-date').textContent = new Date().toLocaleDateString();
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                this.currentTab = e.target.getAttribute('href').substring(1);
                this.updateCurrentTabContent();
            });
        });

        // Auto-refresh dashboard every 30 seconds
        setInterval(() => {
            if (this.currentTab === 'dashboard') {
                this.updateDashboard();
            }
        }, 30000);
    }

    /**
     * Update dashboard with current statistics
     */
    updateDashboard() {
        const inventorySummary = this.inventoryManager.getInventorySummary();
        const salesSummary = this.reportsManager.getSalesSummary();

        // Update dashboard cards
        document.getElementById('total-products').textContent = inventorySummary.totalProducts;
        document.getElementById('total-customers').textContent = dataStore.getAllCustomers().length;
        document.getElementById('total-orders').textContent = salesSummary.totalOrders;
        document.getElementById('low-stock-count').textContent = inventorySummary.lowStockCount;

        // Update recent orders
        this.updateRecentOrders();

        // Update low stock alerts
        this.updateLowStockAlerts();
    }

    /**
     * Update recent orders display
     */
    updateRecentOrders() {
        const recentOrders = dataStore.getAllOrders()
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
            .slice(0, 5);

        const container = document.getElementById('recent-orders-list');
        
        if (recentOrders.length === 0) {
            container.innerHTML = '<p class="text-muted">No recent orders</p>';
            return;
        }

        container.innerHTML = recentOrders.map(order => {
            const customer = dataStore.getCustomerById(order.customerId);
            const customerName = customer ? customer.name : 'Unknown Customer';
            
            return `
                <div class="border-bottom py-2">
                    <div class="d-flex justify-content-between">
                        <strong>${order.id}</strong>
                        <span class="badge ${this.getStatusBadgeClass(order.status)}">${order.status}</span>
                    </div>
                    <small class="text-muted">${customerName} - ${this.formatCurrency(order.totalAmount)}</small>
                </div>
            `;
        }).join('');
    }

    /**
     * Update low stock alerts
     */
    updateLowStockAlerts() {
        const alerts = this.inventoryManager.checkLowStock();
        const container = document.getElementById('low-stock-alerts');

        if (alerts.length === 0) {
            container.innerHTML = '<p class="text-success">All products are well stocked!</p>';
            return;
        }

        container.innerHTML = alerts.map(alert => `
            <div class="alert alert-warning alert-sm py-2 mb-2">
                <i data-feather="alert-triangle" style="width: 16px; height: 16px;"></i>
                <strong>${alert.productName}</strong><br>
                <small>Stock: ${alert.currentStock} (Threshold: ${alert.threshold})</small>
            </div>
        `).join('');
    }

    /**
     * Get Bootstrap badge class for order status
     */
    getStatusBadgeClass(status) {
        const statusClasses = {
            pending: 'bg-warning text-dark',
            completed: 'bg-success',
            shipped: 'bg-info',
            cancelled: 'bg-danger'
        };
        return statusClasses[status] || 'bg-secondary';
    }

    /**
     * Update content for current tab
     */
    updateCurrentTabContent() {
        switch (this.currentTab) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'products':
                this.updateProductsTable();
                break;
            case 'customers':
                this.updateCustomersTable();
                break;
            case 'orders':
                this.updateOrdersTable();
                break;
            case 'promotions':
                this.updatePromotionsTable();
                break;
            case 'reports':
                this.updateReports();
                break;
        }
    }

    /**
     * Update all tables
     */
    updateAllTables() {
        this.updateProductsTable();
        this.updateCustomersTable();
        this.updateOrdersTable();
        this.updatePromotionsTable();
        this.updateReports();
        
        // Re-initialize Feather icons after updating tables
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    /**
     * Format currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-CA', {
            style: 'currency',
            currency: 'CAD'
        }).format(amount);
    }

    /**
     * Format date
     */
    formatDate(date) {
        return new Date(date).toLocaleDateString();
    }

    /**
     * Show success message
     */
    showSuccessMessage(message) {
        this.showAlert(message, 'success');
    }

    /**
     * Show error message
     */
    showErrorMessage(message) {
        this.showAlert(message, 'danger');
    }

    /**
     * Show alert message
     */
    showAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; max-width: 400px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }

    /**
     * Update products table
     */
    updateProductsTable() {
        const products = dataStore.getAllProducts();
        const tableBody = document.getElementById('products-table');
        
        tableBody.innerHTML = products.map(product => {
            const stockClass = product.stock === 0 ? 'stock-low' : 
                             product.isLowStock() ? 'stock-medium' : 'stock-high';
            const statusBadge = product.stock === 0 ? 
                '<span class="badge bg-danger">Out of Stock</span>' :
                product.isLowStock() ? 
                '<span class="badge bg-warning text-dark">Low Stock</span>' :
                '<span class="badge bg-success">In Stock</span>';

            return `
                <tr>
                    <td>${product.id}</td>
                    <td>${product.name}</td>
                    <td>${this.formatCurrency(product.price)}</td>
                    <td class="${stockClass}">${product.stock}</td>
                    <td>${product.category}</td>
                    <td>${statusBadge}</td>
                    <td class="table-actions">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editProduct('${product.id}')" title="Edit Product">
                            <i data-feather="edit-2" style="width: 14px; height: 14px;"></i>
                            <span class="ms-1">Edit</span>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct('${product.id}')" title="Delete Product">
                            <i data-feather="trash-2" style="width: 14px; height: 14px;"></i>
                            <span class="ms-1">Delete</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Re-initialize Feather icons after updating products table
        if (typeof feather !== 'undefined') {
            setTimeout(() => feather.replace(), 0);
        }
    }

    /**
     * Update customers table
     */
    updateCustomersTable() {
        const customers = dataStore.getAllCustomers();
        const tableBody = document.getElementById('customers-table');
        
        tableBody.innerHTML = customers.map(customer => {
            return `
                <tr>
                    <td>${customer.id}</td>
                    <td>
                        <div class="customer-info">
                            <div class="customer-avatar">${customer.name.charAt(0)}</div>
                            ${customer.name}
                        </div>
                    </td>
                    <td>${customer.email}</td>
                    <td>${customer.phone}</td>
                    <td>${customer.getTotalOrders()}</td>
                    <td class="table-actions">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editCustomer('${customer.id}')" title="Edit Customer">
                            <i data-feather="edit-2" style="width: 14px; height: 14px;"></i>
                            <span class="ms-1">Edit</span>
                        </button>
                        <button class="btn btn-sm btn-outline-info me-1" onclick="viewCustomerOrders('${customer.id}')" title="View Orders">
                            <i data-feather="shopping-bag" style="width: 14px; height: 14px;"></i>
                            <span class="ms-1">Orders</span>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteCustomer('${customer.id}')" title="Delete Customer">
                            <i data-feather="trash-2" style="width: 14px; height: 14px;"></i>
                            <span class="ms-1">Delete</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Re-initialize Feather icons after updating customers table
        if (typeof feather !== 'undefined') {
            setTimeout(() => feather.replace(), 0);
        }
    }

    /**
     * Update orders table
     */
    updateOrdersTable() {
        const orders = dataStore.getAllOrders();
        const tableBody = document.getElementById('orders-table');
        
        tableBody.innerHTML = orders.map(order => {
            const customer = dataStore.getCustomerById(order.customerId);
            const customerName = customer ? customer.name : 'Unknown Customer';
            
            return `
                <tr>
                    <td>${order.id}</td>
                    <td>${customerName}</td>
                    <td>${this.formatDate(order.orderDate)}</td>
                    <td><span class="badge ${this.getStatusBadgeClass(order.status)}">${order.status}</span></td>
                    <td>${this.formatCurrency(order.totalAmount)}</td>
                    <td class="table-actions">
                        <button class="btn btn-sm btn-outline-info me-1" onclick="viewOrderDetails('${order.id}')" title="View Order Details">
                            <i data-feather="eye" style="width: 14px; height: 14px;"></i>
                            <span class="ms-1">View</span>
                        </button>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editOrderStatus('${order.id}')" title="Update Status">
                            <i data-feather="refresh-cw" style="width: 14px; height: 14px;"></i>
                            <span class="ms-1">Status</span>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteOrder('${order.id}')" title="Delete Order">
                            <i data-feather="trash-2" style="width: 14px; height: 14px;"></i>
                            <span class="ms-1">Delete</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Re-initialize Feather icons after updating orders table
        if (typeof feather !== 'undefined') {
            setTimeout(() => feather.replace(), 0);
        }
    }

    /**
     * Update promotions table
     */
    updatePromotionsTable() {
        const promotions = dataStore.getAllPromotions();
        const tableBody = document.getElementById('promotions-table');
        
        tableBody.innerHTML = promotions.map(promotion => {
            const product = dataStore.getProductById(promotion.productId);
            const productName = product ? product.name : 'Unknown Product';
            const statusBadge = promotion.isValid() ? 
                '<span class="badge bg-success">Active</span>' :
                promotion.isExpired() ? 
                '<span class="badge bg-danger">Expired</span>' :
                '<span class="badge bg-secondary">Inactive</span>';

            return `
                <tr>
                    <td>${promotion.id}</td>
                    <td>${productName}</td>
                    <td>${promotion.discountPercentage}%</td>
                    <td>${this.formatDate(promotion.startDate)}</td>
                    <td>${this.formatDate(promotion.endDate)}</td>
                    <td>${statusBadge}</td>
                    <td class="table-actions">
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editPromotion('${promotion.id}')" title="Edit Promotion">
                            <i data-feather="edit-2" style="width: 14px; height: 14px;"></i>
                            <span class="ms-1">Edit</span>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deletePromotion('${promotion.id}')" title="Delete Promotion">
                            <i data-feather="trash-2" style="width: 14px; height: 14px;"></i>
                            <span class="ms-1">Delete</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Re-initialize Feather icons after updating promotions table
        if (typeof feather !== 'undefined') {
            setTimeout(() => feather.replace(), 0);
        }
    }

    /**
     * Update reports
     */
    updateReports() {
        const salesSummary = this.reportsManager.getSalesSummary();
        const topProducts = this.reportsManager.getTopProducts();

        // Update sales summary
        const salesSummaryContainer = document.getElementById('sales-summary');
        salesSummaryContainer.innerHTML = `
            <div class="row text-center">
                <div class="col-6">
                    <h4>${salesSummary.totalOrders}</h4>
                    <small class="text-muted">Total Orders</small>
                </div>
                <div class="col-6">
                    <h4>${this.formatCurrency(salesSummary.totalRevenue)}</h4>
                    <small class="text-muted">Total Revenue</small>
                </div>
            </div>
            <hr>
            <div class="row text-center">
                <div class="col-4">
                    <h5>${salesSummary.completedOrders}</h5>
                    <small class="text-success">Completed</small>
                </div>
                <div class="col-4">
                    <h5>${salesSummary.pendingOrders}</h5>
                    <small class="text-warning">Pending</small>
                </div>
                <div class="col-4">
                    <h5>${salesSummary.cancelledOrders}</h5>
                    <small class="text-danger">Cancelled</small>
                </div>
            </div>
            <hr>
            <p><strong>Average Order Value:</strong> ${this.formatCurrency(salesSummary.averageOrderValue)}</p>
        `;

        // Update top products
        const topProductsContainer = document.getElementById('top-products');
        topProductsContainer.innerHTML = topProducts.map((item, index) => `
            <div class="d-flex justify-content-between align-items-center mb-2 ${index < 3 ? 'border-bottom pb-2' : ''}">
                <div>
                    <strong>${item.productName}</strong><br>
                    <small class="text-muted">${item.quantitySold} units sold</small>
                </div>
                <div class="text-end">
                    <strong>${this.formatCurrency(item.revenue)}</strong>
                </div>
            </div>
        `).join('');
    }

    /**
     * Create all modals
     */
    createModals() {
        const modalsContainer = document.getElementById('modals-container');
        modalsContainer.innerHTML = this.getModalHTML();
        this.setupModalEventListeners();
    }

    /**
     * Get HTML for all modals
     */
    getModalHTML() {
        return `
            <!-- Product Modal -->
            <div class="modal fade" id="productModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Add Product</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="productForm">
                                <input type="hidden" id="productId" name="productId">
                                <div class="mb-3">
                                    <label for="productName" class="form-label">Product Name</label>
                                    <input type="text" class="form-control" id="productName" name="name" required>
                                </div>
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="productPrice" class="form-label">Price</label>
                                        <input type="number" class="form-control" id="productPrice" name="price" step="0.01" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="productStock" class="form-label">Stock</label>
                                        <input type="number" class="form-control" id="productStock" name="stock" required>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="productCategory" class="form-label">Category</label>
                                    <select class="form-control" id="productCategory" name="category" required>
                                        <option value="">Select Category</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Furniture">Furniture</option>
                                        <option value="Appliances">Appliances</option>
                                        <option value="Stationery">Stationery</option>
                                        <option value="Clothing">Clothing</option>
                                        <option value="Books">Books</option>
                                        <option value="Sports">Sports</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="productDescription" class="form-label">Description</label>
                                    <textarea class="form-control" id="productDescription" name="description" rows="3"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="lowStockThreshold" class="form-label">Low Stock Threshold</label>
                                    <input type="number" class="form-control" id="lowStockThreshold" name="lowStockThreshold" value="10">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="saveProduct()">Save Product</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Customer Modal -->
            <div class="modal fade" id="customerModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Add Customer</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="customerForm">
                                <input type="hidden" id="customerId" name="customerId">
                                <div class="mb-3">
                                    <label for="customerName" class="form-label">Full Name</label>
                                    <input type="text" class="form-control" id="customerName" name="name" required>
                                </div>
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="customerEmail" class="form-label">Email</label>
                                        <input type="email" class="form-control" id="customerEmail" name="email" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="customerPhone" class="form-label">Phone</label>
                                        <input type="tel" class="form-control" id="customerPhone" name="phone" required>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="customerAddress" class="form-label">Address</label>
                                    <textarea class="form-control" id="customerAddress" name="address" rows="3"></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="saveCustomer()">Save Customer</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Order Modal -->
            <div class="modal fade" id="orderModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Create Order</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="orderForm">
                                <div class="mb-3">
                                    <label for="orderCustomer" class="form-label">Customer</label>
                                    <select class="form-control" id="orderCustomer" name="customerId" required>
                                        <option value="">Select Customer</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Products</label>
                                    <div id="orderItems">
                                        <div class="order-item row mb-2">
                                            <div class="col-md-6">
                                                <select class="form-control product-select" name="productId" required>
                                                    <option value="">Select Product</option>
                                                </select>
                                            </div>
                                            <div class="col-md-3">
                                                <input type="number" class="form-control quantity-input" name="quantity" placeholder="Quantity" min="1" required>
                                            </div>
                                            <div class="col-md-2">
                                                <span class="form-control-plaintext item-total">CA$0.00</span>
                                            </div>
                                            <div class="col-md-1">
                                                <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeOrderItem(this)">
                                                    <i data-feather="trash-2" style="width: 14px; height: 14px;"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="addOrderItem()">
                                        <i data-feather="plus" style="width: 14px; height: 14px;"></i>
                                        <span class="ms-1">Add Item</span>
                                    </button>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <label for="orderStatus" class="form-label">Status</label>
                                        <select class="form-control" id="orderStatus" name="status">
                                            <option value="pending">Pending</option>
                                            <option value="completed">Completed</option>
                                            <option value="shipped">Shipped</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Total Amount</label>
                                        <div class="form-control-plaintext" id="orderTotal">CA$0.00</div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="saveOrder()">Create Order</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Promotion Modal -->
            <div class="modal fade" id="promotionModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Add Promotion</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="promotionForm">
                                <input type="hidden" id="promotionId" name="promotionId">
                                <div class="mb-3">
                                    <label for="promotionProduct" class="form-label">Product</label>
                                    <select class="form-control" id="promotionProduct" name="productId" required>
                                        <option value="">Select Product</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="discountPercentage" class="form-label">Discount Percentage</label>
                                    <input type="number" class="form-control" id="discountPercentage" name="discountPercentage" min="1" max="100" required>
                                </div>
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label for="startDate" class="form-label">Start Date</label>
                                        <input type="date" class="form-control" id="startDate" name="startDate" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label for="endDate" class="form-label">End Date</label>
                                        <input type="date" class="form-control" id="endDate" name="endDate" required>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="promotionDescription" class="form-label">Description</label>
                                    <textarea class="form-control" id="promotionDescription" name="description" rows="3"></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" onclick="savePromotion()">Save Promotion</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Setup modal event listeners
     */
    setupModalEventListeners() {
        // Populate dropdowns when modals are shown
        $('#orderModal').on('shown.bs.modal', () => {
            this.populateCustomerDropdown();
            this.populateProductDropdowns();
        });

        $('#promotionModal').on('shown.bs.modal', () => {
            this.populatePromotionProductDropdown();
        });

        // Calculate order total when items change
        $(document).on('change', '.product-select, .quantity-input', () => {
            this.calculateOrderTotal();
        });
    }

    /**
     * Populate customer dropdown
     */
    populateCustomerDropdown() {
        const customers = dataStore.getAllCustomers();
        const select = document.getElementById('orderCustomer');
        select.innerHTML = '<option value="">Select Customer</option>' +
            customers.map(customer => 
                `<option value="${customer.id}">${customer.name}</option>`
            ).join('');
    }

    /**
     * Populate product dropdowns
     */
    populateProductDropdowns() {
        const products = dataStore.getAllProducts().filter(p => p.stock > 0);
        const options = '<option value="">Select Product</option>' +
            products.map(product => 
                `<option value="${product.id}" data-price="${product.price}">${product.name} - ${this.formatCurrency(product.price)}</option>`
            ).join('');
        
        document.querySelectorAll('.product-select').forEach(select => {
            select.innerHTML = options;
        });
    }

    /**
     * Populate promotion product dropdown
     */
    populatePromotionProductDropdown() {
        const products = dataStore.getAllProducts();
        const select = document.getElementById('promotionProduct');
        select.innerHTML = '<option value="">Select Product</option>' +
            products.map(product => 
                `<option value="${product.id}">${product.name}</option>`
            ).join('');
    }

    /**
     * Calculate order total
     */
    calculateOrderTotal() {
        let total = 0;
        document.querySelectorAll('.order-item').forEach(item => {
            const productSelect = item.querySelector('.product-select');
            const quantityInput = item.querySelector('.quantity-input');
            const itemTotalSpan = item.querySelector('.item-total');
            
            const selectedOption = productSelect.selectedOptions[0];
            if (selectedOption && quantityInput.value) {
                const price = parseFloat(selectedOption.dataset.price || 0);
                const quantity = parseInt(quantityInput.value || 0);
                const itemTotal = price * quantity;
                itemTotalSpan.textContent = this.formatCurrency(itemTotal);
                total += itemTotal;
            } else {
                itemTotalSpan.textContent = this.formatCurrency(0);
            }
        });
        
        document.getElementById('orderTotal').textContent = this.formatCurrency(total);
    }
}

// ===== GLOBAL VARIABLES =====

// Global UI Manager instance - manages all user interface operations
let uiManager;

// ===== GLOBAL CRUD ACTION FUNCTIONS =====
// These functions handle user interactions with the UI for CRUD operations
// They serve as the bridge between UI events and the underlying data operations

/**
 * Open the edit product modal with pre-filled data
 * 
 * Retrieves product information and populates the product modal form
 * for editing. Sets the modal title to indicate edit mode.
 * 
 * @param {string} productId - ID of the product to edit
 */
function editProduct(productId) {
    const product = dataStore.getProductById(productId);
    if (product) {
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('lowStockThreshold').value = product.lowStockThreshold;
        
        document.querySelector('#productModal .modal-title').textContent = 'Edit Product';
        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        modal.show();
    }
}

/**
 * Delete a product after user confirmation
 * 
 * Shows a confirmation dialog and, if confirmed, deletes the product
 * from the system. Updates the UI to reflect the changes.
 * 
 * @param {string} productId - ID of the product to delete
 */
function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        const result = crudManager.deleteProduct(productId);
        if (result.success) {
            uiManager.showSuccessMessage(result.message);
            uiManager.updateProductsTable();
            uiManager.updateDashboard();
        } else {
            uiManager.showErrorMessage(result.message);
        }
    }
}

/**
 * Save product data (create new or update existing)
 * 
 * Processes the product form data and either creates a new product
 * or updates an existing one based on whether a product ID is present.
 * Handles form validation and user feedback.
 */
function saveProduct() {
    const form = document.getElementById('productForm');
    const formData = new FormData(form);
    const productId = formData.get('productId');
    
    if (productId) {
        // Update existing product
        const updates = {
            name: formData.get('name'),
            price: parseFloat(formData.get('price')),
            stock: parseInt(formData.get('stock')),
            category: formData.get('category'),
            description: formData.get('description'),
            lowStockThreshold: parseInt(formData.get('lowStockThreshold'))
        };
        
        const result = crudManager.updateProduct(productId, updates);
        if (result.success) {
            uiManager.showSuccessMessage(result.message);
            bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
            uiManager.updateProductsTable();
            uiManager.updateDashboard();
            form.reset();
        } else {
            uiManager.showErrorMessage(result.message);
        }
    } else {
        // Create new product
        const result = crudManager.createProduct(
            formData.get('name'),
            parseFloat(formData.get('price')),
            parseInt(formData.get('stock')),
            formData.get('category'),
            formData.get('description'),
            parseInt(formData.get('lowStockThreshold'))
        );
        
        if (result.success) {
            uiManager.showSuccessMessage(result.message);
            bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
            uiManager.updateProductsTable();
            uiManager.updateDashboard();
            form.reset();
        } else {
            uiManager.showErrorMessage(result.message);
        }
    }
}

/**
 * Open the edit customer modal with pre-filled data
 * 
 * Retrieves customer information and populates the customer modal form
 * for editing. Sets the modal title to indicate edit mode.
 * 
 * @param {string} customerId - ID of the customer to edit
 */
function editCustomer(customerId) {
    const customer = dataStore.getCustomerById(customerId);
    if (customer) {
        document.getElementById('customerId').value = customer.id;
        document.getElementById('customerName').value = customer.name;
        document.getElementById('customerEmail').value = customer.email;
        document.getElementById('customerPhone').value = customer.phone;
        document.getElementById('customerAddress').value = customer.address;
        
        document.querySelector('#customerModal .modal-title').textContent = 'Edit Customer';
        const modal = new bootstrap.Modal(document.getElementById('customerModal'));
        modal.show();
    }
}

/**
 * Delete a customer after user confirmation
 * 
 * Shows a confirmation dialog and, if confirmed, deletes the customer
 * from the system. Checks for pending orders before deletion.
 * 
 * @param {string} customerId - ID of the customer to delete
 */
function deleteCustomer(customerId) {
    if (confirm('Are you sure you want to delete this customer?')) {
        const result = crudManager.deleteCustomer(customerId);
        if (result.success) {
            uiManager.showSuccessMessage(result.message);
            uiManager.updateCustomersTable();
            uiManager.updateDashboard();
        } else {
            uiManager.showErrorMessage(result.message);
        }
    }
}

/**
 * Save customer data (create new or update existing)
 * 
 * Processes the customer form data and either creates a new customer
 * or updates an existing one. Handles email validation and user feedback.
 */
function saveCustomer() {
    const form = document.getElementById('customerForm');
    const formData = new FormData(form);
    const customerId = formData.get('customerId');
    
    if (customerId) {
        // Update existing customer
        const updates = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address')
        };
        
        const result = crudManager.updateCustomer(customerId, updates);
        if (result.success) {
            uiManager.showSuccessMessage(result.message);
            bootstrap.Modal.getInstance(document.getElementById('customerModal')).hide();
            uiManager.updateCustomersTable();
            form.reset();
        } else {
            uiManager.showErrorMessage(result.message);
        }
    } else {
        // Create new customer
        const result = crudManager.createCustomer(
            formData.get('name'),
            formData.get('email'),
            formData.get('phone'),
            formData.get('address')
        );
        
        if (result.success) {
            uiManager.showSuccessMessage(result.message);
            bootstrap.Modal.getInstance(document.getElementById('customerModal')).hide();
            uiManager.updateCustomersTable();
            uiManager.updateDashboard();
            form.reset();
        } else {
            uiManager.showErrorMessage(result.message);
        }
    }
}

/**
 * Display customer's order history in a modal
 * 
 * Creates and shows a modal displaying all orders for a specific customer.
 * Shows order details including dates, status, and amounts.
 * 
 * @param {string} customerId - ID of the customer whose orders to display
 */
function viewCustomerOrders(customerId) {
    const customer = dataStore.getCustomerById(customerId);
    const orders = dataStore.getAllOrders().filter(order => order.customerId === customerId);
    
    if (customer) {
        let ordersList = '<div class="list-group">';
        orders.forEach(order => {
            ordersList += `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between">
                        <strong>Order ${order.id}</strong>
                        <span class="badge ${uiManager.getStatusBadgeClass(order.status)}">${order.status}</span>
                    </div>
                    <small class="text-muted">
                        ${uiManager.formatDate(order.orderDate)} - ${uiManager.formatCurrency(order.totalAmount)}
                    </small>
                </div>
            `;
        });
        ordersList += '</div>';
        
        if (orders.length === 0) {
            ordersList = '<p class="text-muted">No orders found for this customer.</p>';
        }
        
        // Create and show modal
        const modalHTML = `
            <div class="modal fade" id="customerOrdersModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Orders for ${customer.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${ordersList}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if present
        const existingModal = document.getElementById('customerOrdersModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('customerOrdersModal'));
        modal.show();
    }
}

/**
 * Edit order status with user prompt
 * 
 * Shows a prompt for the user to enter a new status for an order.
 * Validates the status and updates the order if valid.
 * 
 * @param {string} orderId - ID of the order to update
 */
function editOrderStatus(orderId) {
    const order = dataStore.getOrderById(orderId);
    if (order) {
        const newStatus = prompt(`Current status: ${order.status}\nEnter new status (pending, completed, shipped, cancelled):`, order.status);
        if (newStatus && ['pending', 'completed', 'shipped', 'cancelled'].includes(newStatus)) {
            const result = crudManager.updateOrderStatus(orderId, newStatus);
            if (result.success) {
                uiManager.showSuccessMessage(result.message);
                uiManager.updateOrdersTable();
                uiManager.updateDashboard();
            } else {
                uiManager.showErrorMessage(result.message);
            }
        }
    }
}

/**
 * Delete an order after user confirmation
 * 
 * Shows a confirmation dialog and deletes the order if confirmed.
 * Restores stock for pending orders before deletion.
 * 
 * @param {string} orderId - ID of the order to delete
 */
function deleteOrder(orderId) {
    if (confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
        const result = crudManager.deleteOrder(orderId);
        if (result.success) {
            uiManager.showSuccessMessage(result.message);
            uiManager.updateOrdersTable();
            uiManager.updateDashboard();
        } else {
            uiManager.showErrorMessage(result.message);
        }
    }
}

/**
 * Display detailed order information in a modal
 * 
 * Creates and shows a modal with comprehensive order details including
 * customer info, order items, quantities, prices, and totals.
 * 
 * @param {string} orderId - ID of the order to display
 */
function viewOrderDetails(orderId) {
    const order = dataStore.getOrderById(orderId);
    const customer = dataStore.getCustomerById(order.customerId);
    
    if (order) {
        let itemsList = '<div class="table-responsive"><table class="table table-sm">';
        itemsList += '<thead><tr><th>Product</th><th>Quantity</th><th>Price</th><th>Total</th></tr></thead><tbody>';
        
        order.items.forEach(item => {
            const product = dataStore.getProductById(item.productId);
            const productName = product ? product.name : 'Unknown Product';
            itemsList += `
                <tr>
                    <td>${productName}</td>
                    <td>${item.quantity}</td>
                    <td>${uiManager.formatCurrency(item.price)}</td>
                    <td>${uiManager.formatCurrency(item.price * item.quantity)}</td>
                </tr>
            `;
        });
        itemsList += '</tbody></table></div>';
        
        // Create and show modal
        const modalHTML = `
            <div class="modal fade" id="orderDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Order Details - ${order.id}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <strong>Customer:</strong> ${customer ? customer.name : 'Unknown Customer'}<br>
                                    <strong>Order Date:</strong> ${uiManager.formatDate(order.orderDate)}<br>
                                    <strong>Status:</strong> <span class="badge ${uiManager.getStatusBadgeClass(order.status)}">${order.status}</span>
                                </div>
                                <div class="col-md-6 text-end">
                                    <h4>Total: ${uiManager.formatCurrency(order.totalAmount)}</h4>
                                </div>
                            </div>
                            <h6>Order Items:</h6>
                            ${itemsList}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if present
        const existingModal = document.getElementById('orderDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
        modal.show();
    }
}

/**
 * Add a new item row to the order form
 * 
 * Dynamically creates a new product selection row in the order modal with
 * modern UI elements including Feather icons and enhanced styling.
 * Populates the product dropdown and renders icons for the new elements.
 */
function addOrderItem() {
    const orderItems = document.getElementById('orderItems');
    const newItem = document.createElement('div');
    newItem.className = 'order-item row mb-2';
    newItem.innerHTML = `
        <div class="col-md-6">
            <select class="form-control product-select" name="productId" required>
                <option value="">Select Product</option>
            </select>
        </div>
        <div class="col-md-3">
            <input type="number" class="form-control quantity-input" name="quantity" placeholder="Quantity" min="1" required>
        </div>
        <div class="col-md-2">
            <span class="form-control-plaintext item-total">CA$0.00</span>
        </div>
        <div class="col-md-1">
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeOrderItem(this)">
                <i data-feather="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
        </div>
    `;
    
    orderItems.insertBefore(newItem, orderItems.lastElementChild);
    uiManager.populateProductDropdowns();
    
    // Re-initialize Feather icons for the new item
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}

/**
 * Remove an item row from the order form
 * 
 * Removes the specified order item row and recalculates the order total.
 * 
 * @param {HTMLElement} button - The remove button that was clicked
 */
function removeOrderItem(button) {
    const orderItem = button.closest('.order-item');
    orderItem.remove();
    uiManager.calculateOrderTotal();
}

/**
 * Save order data and create new order
 * 
 * Processes the order form data, validates customer and items,
 * checks stock availability, and creates the order. Updates
 * product stock levels and customer records.
 */
function saveOrder() {
    const form = document.getElementById('orderForm');
    const formData = new FormData(form);
    const customerId = formData.get('customerId');
    const status = formData.get('status') || 'pending';
    
    // Collect order items
    const items = [];
    document.querySelectorAll('.order-item').forEach(item => {
        const productSelect = item.querySelector('.product-select');
        const quantityInput = item.querySelector('.quantity-input');
        
        if (productSelect.value && quantityInput.value) {
            items.push({
                productId: productSelect.value,
                quantity: parseInt(quantityInput.value)
            });
        }
    });
    
    if (!customerId) {
        uiManager.showErrorMessage('Please select a customer');
        return;
    }
    
    if (items.length === 0) {
        uiManager.showErrorMessage('Please add at least one item to the order');
        return;
    }
    
    const result = crudManager.createOrder(customerId, items, status);
    if (result.success) {
        uiManager.showSuccessMessage(result.message);
        bootstrap.Modal.getInstance(document.getElementById('orderModal')).hide();
        uiManager.updateOrdersTable();
        uiManager.updateDashboard();
        form.reset();
        // Reset order items to single item
        const orderItems = document.getElementById('orderItems');
        const children = Array.from(orderItems.children);
        children.slice(1, -1).forEach(child => child.remove()); // Keep first item and add button
    } else {
        uiManager.showErrorMessage(result.message);
    }
}

/**
 * Open the edit promotion modal with pre-filled data
 * 
 * Retrieves promotion information and populates the promotion modal
 * form for editing. Handles date formatting for form inputs.
 * 
 * @param {string} promotionId - ID of the promotion to edit
 */
function editPromotion(promotionId) {
    const promotion = dataStore.getPromotionById(promotionId);
    if (promotion) {
        document.getElementById('promotionId').value = promotion.id;
        document.getElementById('promotionProduct').value = promotion.productId;
        document.getElementById('discountPercentage').value = promotion.discountPercentage;
        document.getElementById('startDate').value = promotion.startDate.toISOString().split('T')[0];
        document.getElementById('endDate').value = promotion.endDate.toISOString().split('T')[0];
        document.getElementById('promotionDescription').value = promotion.description;
        
        document.querySelector('#promotionModal .modal-title').textContent = 'Edit Promotion';
        const modal = new bootstrap.Modal(document.getElementById('promotionModal'));
        modal.show();
    }
}

/**
 * Delete a promotion after user confirmation
 * 
 * Shows a confirmation dialog and deletes the promotion if confirmed.
 * Updates the promotions table to reflect the changes.
 * 
 * @param {string} promotionId - ID of the promotion to delete
 */
function deletePromotion(promotionId) {
    if (confirm('Are you sure you want to delete this promotion?')) {
        const result = crudManager.deletePromotion(promotionId);
        if (result.success) {
            uiManager.showSuccessMessage(result.message);
            uiManager.updatePromotionsTable();
        } else {
            uiManager.showErrorMessage(result.message);
        }
    }
}

/**
 * Save promotion data (create new or update existing)
 * 
 * Processes the promotion form data and either creates a new promotion
 * or updates an existing one. Validates discount percentages and dates.
 */
function savePromotion() {
    const form = document.getElementById('promotionForm');
    const formData = new FormData(form);
    const promotionId = formData.get('promotionId');
    
    if (promotionId) {
        // Update existing promotion
        const updates = {
            discountPercentage: parseFloat(formData.get('discountPercentage')),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            description: formData.get('description')
        };
        
        const result = crudManager.updatePromotion(promotionId, updates);
        if (result.success) {
            uiManager.showSuccessMessage(result.message);
            bootstrap.Modal.getInstance(document.getElementById('promotionModal')).hide();
            uiManager.updatePromotionsTable();
            form.reset();
        } else {
            uiManager.showErrorMessage(result.message);
        }
    } else {
        // Create new promotion
        const result = crudManager.createPromotion(
            formData.get('productId'),
            parseFloat(formData.get('discountPercentage')),
            formData.get('startDate'),
            formData.get('endDate'),
            formData.get('description')
        );
        
        if (result.success) {
            uiManager.showSuccessMessage(result.message);
            bootstrap.Modal.getInstance(document.getElementById('promotionModal')).hide();
            uiManager.updatePromotionsTable();
            form.reset();
        } else {
            uiManager.showErrorMessage(result.message);
        }
    }
}

// ===== APPLICATION INITIALIZATION =====

/**
 * Initialize the retail management application
 * 
 * This event listener ensures the application starts only after the DOM
 * is fully loaded. It creates the UI manager instance and initializes
 * all components, data, and event handlers.
 */
document.addEventListener('DOMContentLoaded', function() {
    // Create and initialize the main UI manager
    uiManager = new UIManager();
    uiManager.init();
});