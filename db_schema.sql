-- Store Rating Platform Database Schema
-- Adheres to relational database design best practices

CREATE DATABASE IF NOT EXISTS `store_rating_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `store_rating_db`;

-- --------------------------------------------------------
-- 1. Table structure for table `users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(60) NOT NULL COMMENT 'Constraint: Min 20, Max 60 characters',
  `email` VARCHAR(255) UNIQUE NOT NULL COMMENT 'Constraint: Standard email validation rules',
  `password` VARCHAR(255) NOT NULL COMMENT 'Constraint: 8-16 chars, 1 uppercase, 1 special',
  `address` VARCHAR(400) NOT NULL COMMENT 'Constraint: Max 400 characters',
  `role` ENUM('admin', 'user', 'store_owner') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Performance indices
  INDEX `idx_user_email` (`email`),
  INDEX `idx_user_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. Table structure for table `stores`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(60) NOT NULL COMMENT 'Constraint: Min 20, Max 60 characters',
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `address` VARCHAR(400) NOT NULL COMMENT 'Constraint: Max 400 characters',
  `owner_id` INT UNIQUE NOT NULL COMMENT '1:1 Relationship with store owner user',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign key constraint
  CONSTRAINT `fk_store_owner` FOREIGN KEY (`owner_id`) 
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    
  -- Performance indices
  INDEX `idx_store_email` (`email`),
  INDEX `idx_store_owner` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Table structure for table `ratings`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ratings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT 'FK referencing normal users',
  `store_id` INT NOT NULL COMMENT 'FK referencing stores',
  `rating` TINYINT NOT NULL COMMENT 'Constraint: Rating between 1 and 5',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Constraints:
  -- Check rating is between 1 and 5
  CONSTRAINT `chk_rating_range` CHECK (`rating` BETWEEN 1 AND 5),
  
  -- Enforce unique ratings (One user can only rate one store once)
  UNIQUE KEY `uq_user_store_rating` (`user_id`, `store_id`),
  
  -- Foreign keys
  CONSTRAINT `fk_rating_user` FOREIGN KEY (`user_id`) 
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_rating_store` FOREIGN KEY (`store_id`) 
    REFERENCES `stores` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    
  -- Performance indices
  INDEX `idx_rating_user` (`user_id`),
  INDEX `idx_rating_store` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. Initial Seed Data (Optional description, handled dynamically by backend/config/db.js)
-- --------------------------------------------------------
-- Default Administrator Account:
-- Email: admin@storerating.com
-- Password: Password123!
--
-- Default Tester User Account:
-- Email: user@storerating.com
-- Password: Password123!
--
-- Default Store Owner Account:
-- Email: owner@storerating.com
-- Password: Password123!
-- Store: The Delicious Gourmet Bakery Shop
