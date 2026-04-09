-- Add Foreign Key Constraints and Indexes for Data Integrity
-- Ensures referential integrity between tables and improves query performance

-- ============================================================================
-- Foreign Key Constraints
-- ============================================================================

-- Transactions table: foreign key to users
ALTER TABLE `transactions` 
ADD CONSTRAINT `transactions_userId_fk` 
FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE;

-- Installments table: foreign key to users  
ALTER TABLE `installments` 
ADD CONSTRAINT `installments_userId_fk` 
FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE;

-- Installment Payments table: foreign key to installments
ALTER TABLE `installmentPayments` 
ADD CONSTRAINT `installmentPayments_installmentId_fk` 
FOREIGN KEY (`installmentId`) REFERENCES `installments`(`id`) ON DELETE CASCADE;

-- Savings table: foreign key to users
ALTER TABLE `savings` 
ADD CONSTRAINT `savings_userId_fk` 
FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE;

-- Budgets table: foreign key to users
ALTER TABLE `budgets` 
ADD CONSTRAINT `budgets_userId_fk` 
FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE;

-- Activity Logs table: foreign key to users
ALTER TABLE `activityLogs` 
ADD CONSTRAINT `activityLogs_userId_fk` 
FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE;

-- ============================================================================
-- Performance Indexes
-- ============================================================================

-- Index for user lookups in transactions (most common query pattern)
CREATE INDEX `idx_transactions_userId` ON `transactions`(`userId`);

-- Index for user lookups in installments
CREATE INDEX `idx_installments_userId` ON `installments`(`userId`);

-- Index for installment lookups in payments (nested query)
CREATE INDEX `idx_installmentPayments_installmentId` ON `installmentPayments`(`installmentId`);

-- Index for payment status queries
CREATE INDEX `idx_installmentPayments_isPaid` ON `installmentPayments`(`isPaid`);

-- Index for user lookups in savings
CREATE INDEX `idx_savings_userId` ON `savings`(`userId`);

-- Index for user lookups in budgets
CREATE INDEX `idx_budgets_userId` ON `budgets`(`userId`);

-- Index for month/year queries in budgets
CREATE INDEX `idx_budgets_monthYear` ON `budgets`(`month`, `year`);

-- Index for user lookups in activity logs
CREATE INDEX `idx_activityLogs_userId` ON `activityLogs`(`userId`);

-- Index for activity type queries
CREATE INDEX `idx_activityLogs_type` ON `activityLogs`(`type`);