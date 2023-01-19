CREATE DATABASE IF NOT EXISTS `school_power`
    CACHEMODEL 'last_row'
    DURATION 7d
    KEEP 3650d
    SINGLE_STABLE 1;

USE `school_power`;

CREATE STABLE `powers` (
    `ts` TIMESTAMP,
    `power` int
) TAGS (
    `area` NCHAR(16),
    `building` NCHAR(16),
    `room` NCHAR(16),
    `create_time` TIMESTAMP,
    `is_show` BOOL
);
