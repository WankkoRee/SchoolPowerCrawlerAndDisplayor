CREATE DATABASE IF NOT EXISTS `school_power`
    CACHEMODEL 'last_row'
    COMP 2
    DURATION 1d
    KEEP 3650d
    SINGLE_STABLE 0;
USE `school_power`;

CREATE STABLE `powers` (
    `ts` TIMESTAMP,
    `power` int,
    `spending` int
) TAGS (
    `area` NCHAR(16),
    `building` NCHAR(16),
    `room` NCHAR(16),
    `create_time` TIMESTAMP,
    `is_show` BOOL
);
