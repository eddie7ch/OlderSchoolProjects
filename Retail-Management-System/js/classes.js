/**
 * Core Classes for Retail Management System
 * This file contains the main classes: Product, Customer, Order, and Promotion
 * Each class includes properties and methods to manage retail operations
 */

/**
 * Product Class
 * Manages product information including inventory, pricing, and promotions
 */
class Product {
    constructor(id, name, price, stock, category, description = '', lowStockThreshold = 10) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.stock = stock;
        this.category = category;
        this.description = description;
        this.lowStockThreshold = lowStockThreshold;
        this.isOnSale = false;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * Check if product is in stock
     * @param {number} quantity - Quantity to check
     * @returns {boolean} - True if enough stock available
     */
    isInStock(quantity = 1) {
        return this.stock >= quantity;
    }

    /**
     * Check if product stock is below threshold
     * @returns {boolean} - True if stock is low
     */
    isLowStock() {
        return this.stock <= this.lowStockThreshold;
    }

    /**
     * Update stock quantity
     * @param {number} quantity - Quantity to add (positive) or remove (negative)
     * @returns {boolean} - True if update successful
     */
    updateStock(quantity) {
        const newStock = this.stock + quantity;
        if (newStock < 0) {
            return false; // Cannot have negative stock
        }
        this.stock = newStock;
        this.updatedAt = new Date();
        return true;
    }

    /**
     * Apply promotion to product
     * @param {Promotion} promotion - Promotion object
     * @returns {number} - Discounted price
     */
    applyPromotion(promotion) {
        if (promotion && promotion.isValid() && promotion.productId === this.id) {
            this.isOnSale = true;
            return this.price * (1 - promotion.discountPercentage / 100);
        }
        return this.price;
    }

    /**
     * Get current effective price (considering promotions)
     * @param {Array} promotions - Array of promotions
     * @returns {number} - Current price
     */
    getCurrentPrice(promotions = []) {
        const activePromotion = promotions.find(promo => 
            promo.productId === this.id && promo.isValid()
        );
        return activePromotion ? this.applyPromotion(activePromotion) : this.price;
    }

    /**
     * Get product info as formatted object
     * @returns {Object} - Product information
     */
    getInfo() {
        return {
            id: this.id,
            name: this.name,
            price: this.price,
            stock: this.stock,
            category: this.category,
            description: this.description,
            isLowStock: this.isLowStock(),
            isOnSale: this.isOnSale,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

/**
 * Customer Class
 * Manages customer information and preferences
 */
class Customer {
    constructor(id, name, email, phone, address = '') {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.preferences = [];
        this.orderHistory = [];
        this.totalSpent = 0;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * Add preference to customer
     * @param {string} preference - Customer preference
     */
    addPreference(preference) {
        if (!this.preferences.includes(preference)) {
            this.preferences.push(preference);
            this.updatedAt = new Date();
        }
    }

    /**
     * Remove preference from customer
     * @param {string} preference - Preference to remove
     */
    removePreference(preference) {
        const index = this.preferences.indexOf(preference);
        if (index > -1) {
            this.preferences.splice(index, 1);
            this.updatedAt = new Date();
        }
    }

    /**
     * Add order to customer history
     * @param {Order} order - Order object
     */
    addOrder(order) {
        this.orderHistory.push(order.id);
        this.totalSpent += order.totalAmount;
        this.updatedAt = new Date();
    }

    /**
     * Get customer's total orders count
     * @returns {number} - Number of orders
     */
    getTotalOrders() {
        return this.orderHistory.length;
    }

    /**
     * Get customer info as formatted object
     * @returns {Object} - Customer information
     */
    getInfo() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            phone: this.phone,
            address: this.address,
            preferences: this.preferences,
            totalOrders: this.getTotalOrders(),
            totalSpent: this.totalSpent,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

/**
 * Order Class
 * Manages orders linking customers to products
 */
class Order {
    constructor(id, customerId, status = 'pending') {
        this.id = id;
        this.customerId = customerId;
        this.items = []; // Array of {productId, quantity, price}
        this.status = status; // pending, completed, shipped, cancelled
        this.orderDate = new Date();
        this.totalAmount = 0;
        this.notes = '';
    }

    /**
     * Add item to order
     * @param {number} productId - Product ID
     * @param {number} quantity - Quantity
     * @param {number} price - Price per unit
     */
    addItem(productId, quantity, price) {
        const existingItem = this.items.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                productId: productId,
                quantity: quantity,
                price: price
            });
        }
        this.calculateTotal();
    }

    /**
     * Remove item from order
     * @param {number} productId - Product ID to remove
     */
    removeItem(productId) {
        this.items = this.items.filter(item => item.productId !== productId);
        this.calculateTotal();
    }

    /**
     * Update item quantity in order
     * @param {number} productId - Product ID
     * @param {number} newQuantity - New quantity
     */
    updateItemQuantity(productId, newQuantity) {
        const item = this.items.find(item => item.productId === productId);
        if (item) {
            if (newQuantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = newQuantity;
                this.calculateTotal();
            }
        }
    }

    /**
     * Calculate total amount for order
     */
    calculateTotal() {
        this.totalAmount = this.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    /**
     * Update order status
     * @param {string} newStatus - New status
     */
    updateStatus(newStatus) {
        const validStatuses = ['pending', 'completed', 'shipped', 'cancelled'];
        if (validStatuses.includes(newStatus)) {
            this.status = newStatus;
        }
    }

    /**
     * Get order info as formatted object
     * @returns {Object} - Order information
     */
    getInfo() {
        return {
            id: this.id,
            customerId: this.customerId,
            items: this.items,
            status: this.status,
            orderDate: this.orderDate,
            totalAmount: this.totalAmount,
            notes: this.notes,
            itemCount: this.items.length
        };
    }
}

/**
 * Promotion Class
 * Manages promotional offers for products
 */
class Promotion {
    constructor(id, productId, discountPercentage, startDate, endDate, description = '') {
        this.id = id;
        this.productId = productId;
        this.discountPercentage = discountPercentage;
        this.startDate = new Date(startDate);
        this.endDate = new Date(endDate);
        this.description = description;
        this.isActive = true;
        this.createdAt = new Date();
    }

    /**
     * Check if promotion is currently valid
     * @returns {boolean} - True if promotion is valid
     */
    isValid() {
        const now = new Date();
        return this.isActive && 
               now >= this.startDate && 
               now <= this.endDate;
    }

    /**
     * Check if promotion has expired
     * @returns {boolean} - True if promotion has expired
     */
    isExpired() {
        const now = new Date();
        return now > this.endDate;
    }

    /**
     * Activate or deactivate promotion
     * @param {boolean} active - Active status
     */
    setActive(active) {
        this.isActive = active;
    }

    /**
     * Calculate discount amount for given price
     * @param {number} price - Original price
     * @returns {number} - Discount amount
     */
    calculateDiscount(price) {
        return price * (this.discountPercentage / 100);
    }

    /**
     * Get promotion info as formatted object
     * @returns {Object} - Promotion information
     */
    getInfo() {
        return {
            id: this.id,
            productId: this.productId,
            discountPercentage: this.discountPercentage,
            startDate: this.startDate,
            endDate: this.endDate,
            description: this.description,
            isActive: this.isActive,
            isValid: this.isValid(),
            isExpired: this.isExpired(),
            createdAt: this.createdAt
        };
    }
}

/**
 * Utility class for generating unique IDs
 */
class IDGenerator {
    static generateProductId() {
        return 'PRD' + Date.now() + Math.floor(Math.random() * 1000);
    }

    static generateCustomerId() {
        return 'CUST' + Date.now() + Math.floor(Math.random() * 1000);
    }

    static generateOrderId() {
        return 'ORD' + Date.now() + Math.floor(Math.random() * 1000);
    }

    static generatePromotionId() {
        return 'PROMO' + Date.now() + Math.floor(Math.random() * 1000);
    }
}