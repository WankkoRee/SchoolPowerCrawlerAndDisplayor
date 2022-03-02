SET NAMES utf8mb4;

-- ----------------------------
-- Table structure for se_room
-- ----------------------------
DROP TABLE IF EXISTS `se_room`;
CREATE TABLE `se_room`  (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `area` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `building` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `room` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `create_time` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `room`(`room`) USING BTREE,
  INDEX `area`(`area`) USING BTREE,
  INDEX `building`(`building`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for se_log
-- ----------------------------
DROP TABLE IF EXISTS `se_log`;
CREATE TABLE `se_log`  (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `room` int(10) UNSIGNED NOT NULL,
  `power` decimal(10, 2) NOT NULL,
  `log_time` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `room`(`room`) USING BTREE,
  CONSTRAINT `log_ibfk_1` FOREIGN KEY (`room`) REFERENCES `se_room` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;
