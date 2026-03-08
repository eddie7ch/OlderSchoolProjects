/**
 * Data Management and CRUD Operations
 * This file contains the data storage and CRUD operations for the retail management system
 */

/**
 * Data Store - In-memory storage for all entities
 */
class DataStore {
    constructor() {
        this.products = new Map();
        this.customers = new Map();
        this.orders = new Map();
        this.promotions = new Map();
        this.initializeSampleData();
    }

    /**
     * Initialize with sample data for demonstration
     */
    initializeSampleData() {
        // Sample Products
        const sampleProducts = [
            new Product('PRD001', 'Laptop Computer', 999.99, 25, 'Electronics', 'High-performance laptop for business use', 5),
            new Product('PRD002', 'Wireless Mouse', 29.99, 150, 'Electronics', 'Ergonomic wireless mouse', 20),
            new Product('PRD003', 'Office Chair', 199.99, 8, 'Furniture', 'Comfortable ergonomic office chair', 10),
            new Product('PRD004', 'Desk Lamp', 49.99, 3, 'Furniture', 'LED desk lamp with adjustable brightness', 5),
            new Product('PRD005', 'Coffee Maker', 89.99, 12, 'Appliances', 'Programmable coffee maker', 8),
            new Product('PRD006', 'Notebook Set', 12.99, 200, 'Stationery', 'Set of 3 notebooks', 50),
            new Product('PRD007', 'Smartphone', 599.99, 0, 'Electronics', 'Latest smartphone model', 5),
            new Product('PRD008', 'Headphones', 129.99, 45, 'Electronics', 'Noise-cancelling headphones', 15)
        ];

        sampleProducts.forEach(product => {
            this.products.set(product.id, product);
        });

        // Sample Customers
        const sampleCustomers = [
            new Customer('CUST001', 'John Smith', 'john.smith@email.com', '555-0101', '123 Main St, City, State'),
            new Customer('CUST002', 'Sarah Johnson', 'sarah.j@email.com', '555-0102', '456 Oak Ave, City, State'),
            new Customer('CUST003', 'Mike Davis', 'mike.davis@email.com', '555-0103', '789 Pine St, City, State'),
            new Customer('CUST004', 'Emily Brown', 'emily.brown@email.com', '555-0104', '321 Elm St, City, State'),
            new Customer('CUST005', 'David Wilson', 'david.w@email.com', '555-0105', '654 Maple Ave, City, State')
        ];

        sampleCustomers.forEach(customer => {
            // Add some preferences
            customer.addPreference('Electronics');
            customer.addPreference('Fast Shipping');
            this.customers.set(customer.id, customer);
        });

        // Sample Orders
        const sampleOrders = [
            new Order('ORD001', 'CUST001', 'completed'),
            new Order('ORD002', 'CUST002', 'shipped'),
            new Order('ORD003', 'CUST003', 'pending'),
            new Order('ORD004', 'CUST001', 'completed'),
            new Order('ORD005', 'CUST004', 'pending')
        ];

        // Add items to orders
        sampleOrders[0].addItem('PRD001', 1, 999.99);
        sampleOrders[0].addItem('PRD002', 2, 29.99);

        sampleOrders[1].addItem('PRD003', 1, 199.99);
        sampleOrders[1].addItem('PRD004', 1, 49.99);

        sampleOrders[2].addItem('PRD005', 1, 89.99);
        sampleOrders[2].addItem('PRD006', 3, 12.99);

        sampleOrders[3].addItem('PRD008', 1, 129.99);

        sampleOrders[4].addItem('PRD002', 1, 29.99);
        sampleOrders[4].addItem('PRD006', 2, 12.99);

        sampleOrders.forEach(order => {
            this.orders.set(order.id, order);
            // Update customer order history
            const customer = this.customers.get(order.customerId);
            if (customer) {
                customer.addOrder(order);
            }
        });

        // Sample Promotions
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const samplePromotions = [
            new Promotion('PROMO001', 'PRD002', 15, yesterday, nextWeek, 'Mouse Sale - 15% off'),
            new Promotion('PROMO002', 'PRD005', 20, yesterday, tomorrow, 'Coffee Maker Special'),
            new Promotion('PROMO003', 'PRD008', 10, yesterday, nextWeek, 'Headphones Discount')
        ];

        samplePromotions.forEach(promotion => {
            this.promotions.set(promotion.id, promotion);
        });
    }

    /**
     * Get all entities of a specific type
     */
    getAllProducts() { return Array.from(this.products.values()); }
    getAllCustomers() { return Array.from(this.customers.values()); }
    getAllOrders() { return Array.from(this.orders.values()); }
    getAllPromotions() { return Array.from(this.promotions.values()); }

    /**
     * Get entity by ID
     */
    getProductById(id) { return this.products.get(id); }
    getCustomerById(id) { return this.customers.get(id); }
    getOrderById(id) { return this.orders.get(id); }
    getPromotionById(id) { return this.promotions.get(id); }
}

/**
 * CRUD Operations Manager
 */
class CRUDManager {
    constructor(dataStore) {
        this.dataStore = dataStore;
    }

    // ==================== PRODUCT CRUD ====================

    /**
     * Create a new product
     */
    createProduct(name, price, stock, category, description = '', lowStockThreshold = 10) {
        try {
            const id = IDGenerator.generateProductId();
            const product = new Product(id, name, price, stock, category, description, lowStockThreshold);
            this.dataStore.products.set(id, product);
            return { success: true, data: product, message: 'Product created successfully' };
        } catch (error) {
            return { success: false, message: 'Error creating product: ' + error.message };
        }
    }

    /**
     * Update existing product
     */
    updateProduct(id, updates) {
        try {
            const product = this.dataStore.getProductById(id);
            if (!product) {
                return { success: false, message: 'Product not found' };
            }

            // Update allowed fields
            const allowedFields = ['name', 'price', 'stock', 'category', 'description', 'lowStockThreshold'];
            allowedFields.forEach(field => {
                if (updates.hasOwnProperty(field)) {
                    product[field] = updates[field];
                }
            });
            product.updatedAt = new Date();

            return { success: true, data: product, message: 'Product updated successfully' };
        } catch (error) {
            return { success: false, message: 'Error updating product: ' + error.message };
        }
    }

    /**
     * Delete product
     */
    deleteProduct(id) {
        try {
            const product = this.dataStore.getProductById(id);
            if (!product) {
                return { success: false, message: 'Product not found' };
            }

            // Check if product is in any pending orders
            const pendingOrders = this.dataStore.getAllOrders().filter(order => 
                order.status === 'pending' && order.items.some(item => item.productId === id)
            );

            if (pendingOrders.length > 0) {
                return { success: false, message: 'Cannot delete product with pending orders' };
            }

            this.dataStore.products.delete(id);
            return { success: true, message: 'Product deleted successfully' };
        } catch (error) {
            return { success: false, message: 'Error deleting product: ' + error.message };
        }
    }

    // ==================== CUSTOMER CRUD ====================

    /**
     * Create a new customer
     */
    createCustomer(name, email, phone, address = '') {
        try {
            // Check for duplicate email
            const existingCustomer = this.dataStore.getAllCustomers().find(c => c.email === email);
            if (existingCustomer) {
                return { success: false, message: 'Customer with this email already exists' };
            }

            const id = IDGenerator.generateCustomerId();
            const customer = new Customer(id, name, email, phone, address);
            this.dataStore.customers.set(id, customer);
            return { success: true, data: customer, message: 'Customer created successfully' };
        } catch (error) {
            return { success: false, message: 'Error creating customer: ' + error.message };
        }
    }

    /**
     * Update existing customer
     */
    updateCustomer(id, updates) {
        try {
            const customer = this.dataStore.getCustomerById(id);
            if (!customer) {
                return { success: false, message: 'Customer not found' };
            }

            // Check for duplicate email if email is being updated
            if (updates.email && updates.email !== customer.email) {
                const existingCustomer = this.dataStore.getAllCustomers().find(c => 
                    c.email === updates.email && c.id !== id
                );
                if (existingCustomer) {
                    return { success: false, message: 'Customer with this email already exists' };
                }
            }

            // Update allowed fields
            const allowedFields = ['name', 'email', 'phone', 'address'];
            allowedFields.forEach(field => {
                if (updates.hasOwnProperty(field)) {
                    customer[field] = updates[field];
                }
            });
            customer.updatedAt = new Date();

            return { success: true, data: customer, message: 'Customer updated successfully' };
        } catch (error) {
            return { success: false, message: 'Error updating customer: ' + error.message };
        }
    }

    /**
     * Delete customer
     */
    deleteCustomer(id) {
        try {
            const customer = this.dataStore.getCustomerById(id);
            if (!customer) {
                return { success: false, message: 'Customer not found' };
            }

            // Check if customer has pending orders
            const pendingOrders = this.dataStore.getAllOrders().filter(order => 
                order.customerId === id && order.status === 'pending'
            );

            if (pendingOrders.length > 0) {
                return { success: false, message: 'Cannot delete customer with pending orders' };
            }

            this.dataStore.customers.delete(id);
            return { success: true, message: 'Customer deleted successfully' };
        } catch (error) {
            return { success: false, message: 'Error deleting customer: ' + error.message };
        }
    }

    // ==================== ORDER CRUD ====================

    /**
     * Create a new order
     */
    createOrder(customerId, items = [], status = 'pending') {
        try {
            const customer = this.dataStore.getCustomerById(customerId);
            if (!customer) {
                return { success: false, message: 'Customer not found' };
            }

            const id = IDGenerator.generateOrderId();
            const order = new Order(id, customerId, status);

            // Add items to order and validate stock
            for (const item of items) {
                const product = this.dataStore.getProductById(item.productId);
                if (!product) {
                    return { success: false, message: `Product ${item.productId} not found` };
                }
                if (!product.isInStock(item.quantity)) {
                    return { success: false, message: `Insufficient stock for ${product.name}` };
                }

                // Get current price (with promotions)
                const currentPrice = product.getCurrentPrice(this.dataStore.getAllPromotions());
                order.addItem(item.productId, item.quantity, currentPrice);

                // Update product stock
                product.updateStock(-item.quantity);
            }

            this.dataStore.orders.set(id, order);
            customer.addOrder(order);

            return { success: true, data: order, message: 'Order created successfully' };
        } catch (error) {
            return { success: false, message: 'Error creating order: ' + error.message };
        }
    }

    /**
     * Update order status
     */
    updateOrderStatus(id, newStatus) {
        try {
            const order = this.dataStore.getOrderById(id);
            if (!order) {
                return { success: false, message: 'Order not found' };
            }

            order.updateStatus(newStatus);
            return { success: true, data: order, message: 'Order status updated successfully' };
        } catch (error) {
            return { success: false, message: 'Error updating order: ' + error.message };
        }
    }

    /**
     * Delete order
     */
    deleteOrder(id) {
        try {
            const order = this.dataStore.getOrderById(id);
            if (!order) {
                return { success: false, message: 'Order not found' };
            }

            // Restore stock for pending orders
            if (order.status === 'pending') {
                order.items.forEach(item => {
                    const product = this.dataStore.getProductById(item.productId);
                    if (product) {
                        product.updateStock(item.quantity);
                    }
                });
            }

            this.dataStore.orders.delete(id);
            return { success: true, message: 'Order deleted successfully' };
        } catch (error) {
            return { success: false, message: 'Error deleting order: ' + error.message };
        }
    }

    // ==================== PROMOTION CRUD ====================

    /**
     * Create a new promotion
     */
    createPromotion(productId, discountPercentage, startDate, endDate, description = '') {
        try {
            const product = this.dataStore.getProductById(productId);
            if (!product) {
                return { success: false, message: 'Product not found' };
            }

            if (discountPercentage < 0 || discountPercentage > 100) {
                return { success: false, message: 'Discount percentage must be between 0 and 100' };
            }

            if (new Date(startDate) >= new Date(endDate)) {
                return { success: false, message: 'End date must be after start date' };
            }

            const id = IDGenerator.generatePromotionId();
            const promotion = new Promotion(id, productId, discountPercentage, startDate, endDate, description);
            this.dataStore.promotions.set(id, promotion);

            return { success: true, data: promotion, message: 'Promotion created successfully' };
        } catch (error) {
            return { success: false, message: 'Error creating promotion: ' + error.message };
        }
    }

    /**
     * Update promotion
     */
    updatePromotion(id, updates) {
        try {
            const promotion = this.dataStore.getPromotionById(id);
            if (!promotion) {
                return { success: false, message: 'Promotion not found' };
            }

            // Validate updates
            if (updates.discountPercentage && (updates.discountPercentage < 0 || updates.discountPercentage > 100)) {
                return { success: false, message: 'Discount percentage must be between 0 and 100' };
            }

            // Update allowed fields
            const allowedFields = ['discountPercentage', 'startDate', 'endDate', 'description', 'isActive'];
            allowedFields.forEach(field => {
                if (updates.hasOwnProperty(field)) {
                    if (field === 'startDate' || field === 'endDate') {
                        promotion[field] = new Date(updates[field]);
                    } else {
                        promotion[field] = updates[field];
                    }
                }
            });

            return { success: true, data: promotion, message: 'Promotion updated successfully' };
        } catch (error) {
            return { success: false, message: 'Error updating promotion: ' + error.message };
        }
    }

    /**
     * Delete promotion
     */
    deletePromotion(id) {
        try {
            const promotion = this.dataStore.getPromotionById(id);
            if (!promotion) {
                return { success: false, message: 'Promotion not found' };
            }

            this.dataStore.promotions.delete(id);
            return { success: true, message: 'Promotion deleted successfully' };
        } catch (error) {
            return { success: false, message: 'Error deleting promotion: ' + error.message };
        }
    }
}

// Global instances
let dataStore;
let crudManager;