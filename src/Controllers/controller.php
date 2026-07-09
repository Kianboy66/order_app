<?php







/* 
 | -----------------------
 |  تابع ساخت و ارسال Request
 | -----------------------
 */
function curlRequest(string $url, string $method = '', array $headers = [], ?string $body = null): array
{
    global $CUSTOMER_LOG_FILE;
    $curl = curl_init();

    curl_setopt_array($curl, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_POSTFIELDS => $body,
        CURLOPT_CONNECTTIMEOUT => 10,
        // CURLOPT_TIMEOUT => 120,
        // CURLOPT_TCP_KEEPALIVE => 1,
        // CURLOPT_NOSIGNAL => 1
    ]);

    $responseBody = curl_exec($curl);
    $curlError = curl_error($curl);
    $curlErrno = curl_errno($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);

    curl_close($curl);

    return [
        'body' => $responseBody,
        'http_code' => $httpCode,
        'curl_error' => $curlError,
        'curl_errno' => $curlErrno,
    ];
}





/* 
 | -----------------------
 |
 | -----------------------
 */
function holooGet($path, $token, $retry = true)
{
    global $BASE_URL;

    $url = $BASE_URL . $path;

    $response = curlRequest($url, 'GET', [
        'Accept: application/json',
        'Content-Type: application/json',
        'Authorization: ' . $token,
    ]);

    if (!empty($response['curl_error'])) {
        jsonResponse([
            'status' => 'error',
            'message' => 'holoo get curl error',
            'error' => $response['curl_error'],
            'curl_errno' => $response['curl_errno'] ?? null,
            'path' => $path,
            'url' => $url
        ], 502);
    }

    $decoded = json_decode($response['body'], true);

    if (!is_array($decoded)) {
        jsonResponse([
            'status' => 'error',
            'message' => 'invalid holoo response',
            'http_code' => $response['http_code'] ?? null,
            'raw' => $response['body'],
            'path' => $path,
            'url' => $url
        ], 500);
    }

    // if (isHolooInvalidTokenResp($decoded)) {
    //     if ($retry) {
    //         $newTokenData = holooLogin(true);

    //         if (empty($newTokenData['token'])) {
    //             jsonResponse([
    //                 'status' => 'error',
    //                 'message' => 'token refresh failed',
    //                 'path' => $path,
    //                 'raw' => $decoded
    //             ], 500);
    //         }

    //         return holooGet($path, $newTokenData['token'], false);
    //     }

    //     jsonResponse([
    //         'status' => 'error',
    //         'message' => 'invalid token after retry',
    //         'path' => $path,
    //         'raw' => $decoded
    //     ], 401);
    // }

    return $decoded;
}








/* 
 | -----------------------
 |  اتصال PDO به دیتابیس
 | -----------------------
 */
function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = require 'config/app.php';
    $db = $config['db'];

    $dsn = "mysql:host={$db['host']};dbname={$db['name']};charset=utf8mb4";

    $pdo = new PDO(
        $dsn,
        $db['user'],
        $db['pass'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    return $pdo;
}








/* 
 | -----------------------
 |  تابع ذخیره محصولات در دیتابیس
 | -----------------------
 */
function saveProductsToDb(array $productList): int
{
    $pdo = db();

    $sql = "
        INSERT INTO products_cache 
            (product_key, raw_json, updated_at)
        VALUES 
            (:product_key, :raw_json, :updated_at)
        ON DUPLICATE KEY UPDATE
            raw_json = VALUES(raw_json),
            updated_at = VALUES(updated_at)
    ";

    $stmt = $pdo->prepare($sql);

    $count = 0;
    $now = date('Y-m-d H:i:s');

    foreach ($productList as $product) {
        if (!is_array($product)) {
            continue;
        }

        /*
         * اینجا باید یک شناسه یکتا از محصول پیدا کنیم.
         * چون ساختار دقیق محصول هلو ممکن است فرق کند،
         * چند گزینه رایج را چک می‌کنیم.
         */
        $productKey =
            $product['ErpCode'] ??
            $product['erpCode'] ??
            $product['Code'] ??
            $product['code'] ??
            $product['Barcode'] ??
            $product['barcode'] ??
            null;

        if (!$productKey) {
            // اگر هیچ کدی نبود، از هش JSON استفاده می‌کنیم
            $productKey = md5(json_encode($product, JSON_UNESCAPED_UNICODE));
        }

        $stmt->execute([
            ':product_key' => (string) $productKey,
            ':raw_json' => json_encode($product, JSON_UNESCAPED_UNICODE),
            ':updated_at' => $now,
        ]);

        $count++;
    }

    return $count;
}








/* 
 | -----------------------
 |  تابع خواندن محصولات از دیتابیس
 | -----------------------
 */
function getProductsFromDb(): array
{
    $pdo = db();

    $stmt = $pdo->query("
        SELECT raw_json, updated_at
        FROM products_cache
        ORDER BY id ASC
    ");

    $products = [];
    $updatedAt = null;

    while ($row = $stmt->fetch()) {
        $product = json_decode($row['raw_json'], true);

        if (is_array($product)) {
            $products[] = $product;
        }

        if ($updatedAt === null || $row['updated_at'] > $updatedAt) {
            $updatedAt = $row['updated_at'];
        }
    }

    return [
        'product' => $products,
        'count' => count($products),
        'updated_at' => $updatedAt,
    ];
}







/*
 | -----------------------
 |  ذخیره انبوه مشتریان در دیتابیس به روش Upsert
 | -----------------------
 */
function saveCustomersToDb(array $customerList): void
{
    $pdo = db();
    $now = date('Y-m-d H:i:s');

    // شروع تراکنش برای افزایش سرعت و امنیت داده‌ها
    $pdo->beginTransaction();
    try {
        $sql = "INSERT INTO customers_cache (customer_key, raw_json, updated_at)
                VALUES (:customer_key, :raw_json, :updated_at)
                ON DUPLICATE KEY UPDATE
                    raw_json = VALUES(raw_json),
                    updated_at = VALUES(updated_at)";

        $stmt = $pdo->prepare($sql);

        foreach ($customerList as $customer) {
            // هلو معمولاً فیلد 'Code' یا 'customerCode' یا 'CustomerCode' دارد.
            // برای اطمینان بیشتر چند حالت را بررسی می‌کنیم.
            $customerKey = $customer['customerCode']
                ?? $customer['CustomerCode']
                ?? $customer['Code']
                ?? null;

            if ($customerKey === null) {
                // اگر کلیدی پیدا نشد، لاگ بینداز یا از این رکورد بگذر
                continue;
            }

            $stmt->execute([
                ':customer_key' => (string) $customerKey,
                ':raw_json' => json_encode($customer, JSON_UNESCAPED_UNICODE),
                ':updated_at' => $now,
            ]);
        }

        $pdo->commit();
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}







/*
 | -----------------------
 | خواندن تمام مشتریان از دیتابیس
 | -----------------------
 */
function getCustomersFromDb(): array
{
    $pdo = db();
    $stmt = $pdo->query("SELECT raw_json, updated_at FROM customers_cache ORDER BY id ASC");
    $rows = $stmt->fetchAll();

    $customers = [];
    $lastUpdated = null;

    foreach ($rows as $row) {
        $customers[] = json_decode($row['raw_json'], true);
        $lastUpdated = $row['updated_at']; // آخرین زمان به‌روزرسانی
    }

    return [
        'customer' => $customers,
        'count' => count($customers),
        'updated_at' => $lastUpdated
    ];
}







/* 
 | -----------------------
 |  ذخیره یک مشتری در دیتابیس
 | -----------------------
 */
function saveSingleCustomerToDb(array $customer): array
{
    $config = require  'config/app.php';
    $table = $config['db']['customers_table'] ?? 'customers_cache';

    $pdo = db();

    $customerKey = $customer['_customer_key'] ?? null;
    if (!$customerKey) {
        return [
            'success' => false,
            'message' => 'customer_key تولید نشد'
        ];
    }

    $rawJson = json_encode($customer, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $sql = "
        INSERT INTO {$table} (customer_key, raw_json, updated_at, created_at)
        VALUES (:customer_key, :raw_json, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
            raw_json = VALUES(raw_json),
            updated_at = NOW()
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':customer_key' => $customerKey,
        ':raw_json' => $rawJson,
    ]);

    return [
        'success' => true,
        'customer_key' => $customerKey
    ];
}




 




  /* 
 | -----------------------
 |
 | -----------------------
 */






  /* 
 | -----------------------
 |
 | -----------------------
 */






  /* 
 | -----------------------
 |
 | -----------------------
 */






  /* 
 | -----------------------
 |
 | -----------------------
 */






  /* 
 | -----------------------
 |
 | -----------------------
 */






  /* 
 | -----------------------
 |
 | -----------------------
 */
