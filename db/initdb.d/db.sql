CREATE DATABASE IF NOT EXISTS school_power;

USE school_power;

SET NAMES utf8mb4;

-- ----------------------------
-- Table structure for sp_room
-- ----------------------------
DROP TABLE IF EXISTS `sp_room`;
CREATE TABLE `sp_room`  (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `area` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `building` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `room` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `power` decimal(10, 2) NOT NULL DEFAULT 0.00,
  `create_time` datetime NOT NULL,
  `update_time` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `is_show` bool NOT NULL DEFAULT true,
  `avg_day_this_week` decimal(10, 2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `room`(`room`) USING BTREE,
  INDEX `area`(`area`) USING BTREE,
  INDEX `building`(`building`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for sp_log
-- ----------------------------
DROP TABLE IF EXISTS `sp_log`;
CREATE TABLE `sp_log`  (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `room` int(10) UNSIGNED NOT NULL,
  `power` decimal(10, 2) NOT NULL,
  `log_time` datetime NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `room`(`room`) USING BTREE,
  INDEX `log_time`(`log_time`) USING BTREE,
  CONSTRAINT `sp_log_ibfk_1` FOREIGN KEY (`room`) REFERENCES `sp_room` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for sp_daily
-- ----------------------------
DROP TABLE IF EXISTS `sp_daily`;
CREATE TABLE `sp_daily`  (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `room` int(10) UNSIGNED NOT NULL COMMENT '只在insert时初始化本数据',
  `date` date NOT NULL COMMENT '只在insert时初始化本数据',
  `power` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '只在insert时初始化本数据，只在sp_log触发daily时修改本数据',
  `oldest_power` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '只在insert时初始化本数据',
  `oldest_time` datetime NOT NULL COMMENT '只在insert时初始化本数据',
  `lastest_power` decimal(10, 2) NOT NULL DEFAULT 0.00 COMMENT '只在insert时初始化本数据，只在update时修改本数据',
  `lastest_time` datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '只在insert时初始化本数据，只在update时修改本数据',
  `update_time` datetime NOT NULL DEFAULT '1970-01-01 00:00:00' COMMENT '只在insert时初始化本数据，只在sp_log触发daily时修改本数据',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `room_daily`(`room`, `date`) USING BTREE,
  CONSTRAINT `sp_daily_ibfk_1` FOREIGN KEY (`room`) REFERENCES `sp_room` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Function structure for calc_daily
-- ----------------------------
DROP FUNCTION IF EXISTS `calc_daily`;
delimiter ;;
CREATE FUNCTION `calc_daily`(`arg_room` int,`arg_date` date)
 RETURNS decimal(10,2)
  READS SQL DATA
BEGIN
	declare already_power decimal(10,2) DEFAULT 0;
	declare already_time datetime DEFAULT now();

	declare power_yesterday decimal(10,2) DEFAULT 0;
	declare power_today decimal(10,2) DEFAULT 0;
	declare power_tomorrow decimal(10,2) DEFAULT 0;

	declare today bool DEFAULT false;
	declare today_oldest_power decimal(10,2) DEFAULT 0;
	declare today_oldest_time datetime DEFAULT now();
	declare today_lastest_power decimal(10,2) DEFAULT 0;
	declare today_lastest_time datetime DEFAULT now();

	declare yesterday bool DEFAULT false;
	declare yesterday_power decimal(10,2) DEFAULT 0;
	declare yesterday_time datetime DEFAULT now();

	declare tomorrow bool DEFAULT false;
	declare tomorrow_power decimal(10,2) DEFAULT 0;
	declare tomorrow_time datetime DEFAULT now();

	select count(*), oldest_power, oldest_time, lastest_power, lastest_time, lastest_power-oldest_power, power, update_time into today, today_oldest_power, today_oldest_time, today_lastest_power, today_lastest_time, power_today, already_power, already_time from sp_daily where room = arg_room and date = arg_date;
	if today = 0 then
		return 0;
	end if;

	if date(already_time) > arg_date then
		return already_power;
	end if;

	select count(*), lastest_power, lastest_time into yesterday, yesterday_power, yesterday_time from sp_daily where room = arg_room and date = DATE_SUB(arg_date, INTERVAL 1 day);
	if yesterday = 1 then
		set power_yesterday = (today_oldest_power-yesterday_power) / TIMESTAMPDIFF(SECOND, yesterday_time, today_oldest_time) * TIMESTAMPDIFF(SECOND, arg_date, today_oldest_time);
	end if;

	select count(*), oldest_power, oldest_time into tomorrow, tomorrow_power, tomorrow_time from sp_daily where room = arg_room and date = DATE_ADD(arg_date, INTERVAL 1 day);
	if tomorrow = 1 then
		set power_tomorrow = (tomorrow_power-today_lastest_power) / TIMESTAMPDIFF(SECOND, today_lastest_time, tomorrow_time) * TIMESTAMPDIFF(SECOND, today_lastest_time, DATE_SUB(arg_date, INTERVAL 1 day));
	end if;

	RETURN power_yesterday + power_today + power_tomorrow;
END
;;
delimiter ;

-- ----------------------------
-- Function structure for calc_avg_day_in_week
-- ----------------------------
DROP FUNCTION IF EXISTS `calc_avg_day_in_week`;
delimiter ;;
CREATE FUNCTION `calc_avg_day_in_week`(`arg_room` int, `arg_date` date)
 RETURNS decimal(10,2)
  READS SQL DATA
BEGIN
	DECLARE monday decimal(10,2) DEFAULT 0;
	DECLARE tuesday decimal(10,2) DEFAULT 0;
	DECLARE wednesday decimal(10,2) DEFAULT 0;
	DECLARE thursday decimal(10,2) DEFAULT 0;
	DECLARE friday decimal(10,2) DEFAULT 0;
	DECLARE saturday decimal(10,2) DEFAULT 0;
	DECLARE sunday decimal(10,2) DEFAULT 0;

	declare total_power decimal(10,2) DEFAULT 0;
	declare total_day TINYINT UNSIGNED DEFAULT 0;

	declare oneday date DEFAULT STR_TO_DATE(CONCAT(YEARWEEK(arg_date, 1),'Monday'), '%x%v %W');

	set monday = calc_daily(arg_room, oneday);
	if monday != 0 then
		set total_power = total_power + monday;
		set total_day = total_day + 1;
	end if;

	set oneday = date_add(oneday, INTERVAL 1 day);
	set tuesday = calc_daily(arg_room, oneday);
		if tuesday != 0 then
		set total_power = total_power + tuesday;
		set total_day = total_day + 1;
	end if;

	set oneday = date_add(oneday, INTERVAL 1 day);
	set wednesday = calc_daily(arg_room, oneday);
		if wednesday != 0 then
		set total_power = total_power + wednesday;
		set total_day = total_day + 1;
	end if;

	set oneday = date_add(oneday, INTERVAL 1 day);
	set thursday = calc_daily(arg_room, oneday);
		if thursday != 0 then
		set total_power = total_power + thursday;
		set total_day = total_day + 1;
	end if;

	set oneday = date_add(oneday, INTERVAL 1 day);
	set friday = calc_daily(arg_room, oneday);
		if friday != 0 then
		set total_power = total_power + friday;
		set total_day = total_day + 1;
	end if;

	set oneday = date_add(oneday, INTERVAL 1 day);
	set saturday = calc_daily(arg_room, oneday);
		if saturday != 0 then
		set total_power = total_power + saturday;
		set total_day = total_day + 1;
	end if;

	set oneday = date_add(oneday, INTERVAL 1 day);
	set sunday = calc_daily(arg_room, oneday);
		if sunday != 0 then
		set total_power = total_power + sunday;
		set total_day = total_day + 1;
	end if;

	if total_day > 0 then
		RETURN total_power / total_day;
	else
		RETURN 0;
	end if;
END
;;
delimiter ;

-- ----------------------------
-- Triggers structure for table sp_log
-- ----------------------------
DROP TRIGGER IF EXISTS `daily`;
delimiter ;;
CREATE TRIGGER `daily` AFTER INSERT ON `sp_log` FOR EACH ROW begin
	declare has_yesterday bool DEFAULT false;
	declare yesterday date;
	declare today date DEFAULT date(new.log_time);

	insert into sp_daily (room, date, oldest_power, oldest_time, lastest_power, lastest_time)
		values (new.room, today, new.power, new.log_time, new.power, new.log_time)
		ON DUPLICATE KEY UPDATE lastest_power = new.power, lastest_time = new.log_time;

	select count(*), date(update_time) into has_yesterday, yesterday from sp_daily where room = new.room and date = today - INTERVAL 1 day;
	if has_yesterday and yesterday != today then
		update sp_daily set power = calc_daily(new.room, today - INTERVAL 1 day), update_time = new.log_time where room = new.room and date = today - INTERVAL 1 day;
	end if;

	update sp_daily set power = calc_daily(new.room, today), update_time = new.log_time where room = new.room and date = today;
end
;;
delimiter ;

-- ----------------------------
-- Triggers structure for table sp_daily
-- ----------------------------
DROP TRIGGER IF EXISTS `avg_day_this_week_i`;
delimiter ;;
CREATE TRIGGER `avg_day_this_week_i` AFTER INSERT ON `sp_daily` FOR EACH ROW begin
	update sp_room set avg_day_this_week = calc_avg_day_in_week(new.room, new.date) where id = new.room;
end
;;
delimiter ;

-- ----------------------------
-- Triggers structure for table sp_daily
-- ----------------------------
DROP TRIGGER IF EXISTS `avg_day_this_week_u`;
delimiter ;;
CREATE TRIGGER `avg_day_this_week_u` AFTER UPDATE ON `sp_daily` FOR EACH ROW begin
	if old.lastest_time != new.lastest_time then
		update sp_room set avg_day_this_week = calc_avg_day_in_week(new.room, new.date) where id = new.room;
	end if;
end
;;
delimiter ;
