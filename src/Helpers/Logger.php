<?php
class Logger
{
    private static $logDir = 'logs/';

    /**
     * Write log entry
     * 
     * @param string $category Category name (e.g., 'AUTH', 'CUSTOMER', 'API')
     * @param string $message Log message
     * @param string $level Log level: 'INFO', 'ERROR', 'WARNING', 'DEBUG'
     */
    public static function log($category, $message, $level = 'INFO')
    {
        // Ensure logs directory exists
        if (!is_dir(self::$logDir)) {
            mkdir(self::$logDir, 0755, true);
        }

        $timestamp = date('Y-m-d H:i:s');
        $logFile = self::$logDir . strtolower($category) . '.log';
        
        $logEntry = "[{$timestamp}] [{$level}] {$message}" . PHP_EOL;
        
        file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
    }
}