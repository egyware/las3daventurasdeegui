CREATE TABLE `proveedores` (
	`id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
	`website` VARCHAR(2048) NOT NULL COLLATE 'latin1_swedish_ci',
	`empresa` VARCHAR(2048) NOT NULL COLLATE 'latin1_swedish_ci',
	`favicon` VARCHAR(2048) NULL DEFAULT NULL COLLATE 'latin1_swedish_ci',
	`descripcion` TEXT(65535) NOT NULL COLLATE 'latin1_swedish_ci',
	PRIMARY KEY (`id`) USING BTREE
)