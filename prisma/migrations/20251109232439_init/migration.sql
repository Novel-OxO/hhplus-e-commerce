-- CreateTable
CREATE TABLE `users` (
    `user_id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `product_id` BIGINT NOT NULL AUTO_INCREMENT,
    `product_name` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `base_price` DECIMAL(10, 2) NOT NULL,
    `view_count` BIGINT NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`product_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_options` (
    `product_option_id` BIGINT NOT NULL AUTO_INCREMENT,
    `product_id` BIGINT NOT NULL,
    `option_name` VARCHAR(100) NOT NULL,
    `sku` VARCHAR(100) NOT NULL,
    `stock_quantity` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `product_options_product_id_idx`(`product_id`),
    PRIMARY KEY (`product_option_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_rankings` (
    `ranking_id` BIGINT NOT NULL AUTO_INCREMENT,
    `product_id` BIGINT NOT NULL,
    `ranking` INTEGER NOT NULL,
    `view_count` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `product_rankings_product_id_idx`(`product_id`),
    PRIMARY KEY (`ranking_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cart_items` (
    `cart_item_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `product_option_id` BIGINT NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `cart_items_user_id_idx`(`user_id`),
    INDEX `cart_items_product_option_id_idx`(`product_option_id`),
    PRIMARY KEY (`cart_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupons` (
    `coupon_id` BIGINT NOT NULL AUTO_INCREMENT,
    `coupon_name` VARCHAR(200) NOT NULL,
    `discount_type` ENUM('PERCENTAGE', 'FIXED_AMOUNT') NOT NULL,
    `discount_value` DECIMAL(10, 2) NOT NULL,
    `max_discount_amount` DECIMAL(10, 2) NOT NULL,
    `min_order_amount` DECIMAL(10, 2) NOT NULL,
    `total_quantity` INTEGER NOT NULL,
    `issued_quantity` INTEGER NOT NULL DEFAULT 0,
    `valid_from` DATETIME(3) NOT NULL,
    `valid_until` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`coupon_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_coupons` (
    `user_coupon_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `coupon_id` BIGINT NOT NULL,
    `order_id` BIGINT NULL,
    `is_used` BOOLEAN NOT NULL DEFAULT false,
    `issued_at` DATETIME(3) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,

    INDEX `user_coupons_user_id_idx`(`user_id`),
    INDEX `user_coupons_coupon_id_idx`(`coupon_id`),
    INDEX `user_coupons_order_id_idx`(`order_id`),
    PRIMARY KEY (`user_coupon_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `order_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `user_coupon_id` BIGINT NULL,
    `order_status` ENUM('PENDING', 'COMPLETED', 'CANCELLED') NOT NULL,
    `total_price` DECIMAL(10, 2) NOT NULL,
    `discount_price` DECIMAL(10, 2) NOT NULL,
    `final_price` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `orders_user_id_idx`(`user_id`),
    PRIMARY KEY (`order_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `order_item_id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT NOT NULL,
    `product_option_id` BIGINT NOT NULL,
    `product_name` VARCHAR(200) NOT NULL,
    `option_name` VARCHAR(100) NOT NULL,
    `sku` VARCHAR(100) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `order_items_order_id_idx`(`order_id`),
    INDEX `order_items_product_option_id_idx`(`product_option_id`),
    PRIMARY KEY (`order_item_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupon_usage_history` (
    `usage_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_coupon_id` BIGINT NOT NULL,
    `order_id` BIGINT NOT NULL,
    `discount_price` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('USED', 'CANCELLED') NOT NULL,
    `used_at` DATETIME(3) NOT NULL,

    INDEX `coupon_usage_history_user_coupon_id_idx`(`user_coupon_id`),
    INDEX `coupon_usage_history_order_id_idx`(`order_id`),
    PRIMARY KEY (`usage_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `point_balances` (
    `user_id` BIGINT NOT NULL,
    `balance` DECIMAL(10, 2) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `point_charge_requests` (
    `charge_request_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDING', 'COMPLETED', 'FAILED') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed_at` DATETIME(3) NULL,

    INDEX `point_charge_requests_user_id_idx`(`user_id`),
    PRIMARY KEY (`charge_request_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `payment_id` BIGINT NOT NULL AUTO_INCREMENT,
    `charge_request_id` BIGINT NOT NULL,
    `pg_payment_id` VARCHAR(255) NOT NULL,
    `payment_status` ENUM('SUCCESS', 'FAILED', 'PENDING') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `payments_charge_request_id_idx`(`charge_request_id`),
    PRIMARY KEY (`payment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `point_transactions` (
    `transaction_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `transaction_type` ENUM('CHARGE', 'USE') NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `balance_after` DECIMAL(10, 2) NOT NULL,
    `reference_id` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `point_transactions_user_id_idx`(`user_id`),
    PRIMARY KEY (`transaction_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
