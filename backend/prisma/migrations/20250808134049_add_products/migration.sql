-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('pack', 'weight') NOT NULL,
    `user_id` INTEGER NOT NULL,
    `pack_quantity` INTEGER NULL,
    `products_per_pack` INTEGER NULL,
    `buy_price_per_pack` DOUBLE NULL,
    `weight_unit` VARCHAR(191) NULL,
    `total_weight` DOUBLE NULL,
    `buy_price_per_unit` DOUBLE NULL,
    `sell_price_per_unit` DOUBLE NOT NULL,
    `total_units` DOUBLE NOT NULL,
    `total_invested` DOUBLE NOT NULL,
    `total_profit` DOUBLE NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `products_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
