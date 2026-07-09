<?php





function redirect_if($uri)
{
    if ($uri && $uri === '' || $uri === '/') {
        header("Location: " . "http://localhost/index.html");
        exit;
    }
}








/* 
 | -----------------------
 |  تابع ایجاد پاسخ استاندارد
 | -----------------------
 */
function jsonResponse($data, $status = 200): void
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}



/* 
 | -----------------------
 |  تابع خواندن اطلاعات قایل  json
 | -----------------------
 */
function loadJsonFile($path): array
{
    if (!file_exists($path)) {
        return [];
    }

    $content = file_get_contents($path);
    $data = json_decode($content, true);

    return is_array($data) ? $data : [];
}



/* 
 | -----------------------
 |  تابع ذخیره سازی دیتا در فایل جیسون
 | -----------------------
 */
function saveJsonFile($path, $data): bool
{
    return file_put_contents(
        $path,
        json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT)
    ) !== false;
}




// =========================================
// [HELPERS]
// =========================================

function ensureDirectoryExists(string $filePath): void
{
    $dir = dirname($filePath);
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }
}








/* 
 | -----------------------
 |  ساخت رکورد کش مشتری
 | -----------------------
 */
function buildCustomerCacheRecord(array $inputData, array $decoded, array $normalized): array
{
    $customerKey = null;

    if (!empty($normalized['erpCode'])) {
        $customerKey = (string) $normalized['erpCode'];
    } elseif (!empty($inputData['ErpCode'])) {
        $customerKey = (string) $inputData['ErpCode'];
    } elseif (!empty($inputData['Code'])) {
        $customerKey = (string) $inputData['Code'];
    } elseif (!empty($inputData['Barcode'])) {
        $customerKey = (string) $inputData['Barcode'];
    } else {
        $customerKey = md5(json_encode($inputData, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    return array_merge($inputData, [
        'ErpCode' => $normalized['erpCode'] ?? ($inputData['ErpCode'] ?? null),
        'CustomerCode' => $normalized['customerCode'] ?? ($inputData['CustomerCode'] ?? null),
        '_customer_key' => $customerKey,
        '_created_at' => date('Y-m-d H:i:s'),
        '_source' => 'create_customer_api',
        '_holoo_response' => $decoded,
    ]);
}








/* 
 | -----------------------
 |  تابع اعتبارسنجی
 | -----------------------
 */
function validateCustomerCreatePayload(array $data): array
{
    $errors = [];
    $missingFields = [];
    $invalidFields = [];

    // Check cityCode
    if (!isset($data['cityCode']) || $data['cityCode'] === '' || $data['cityCode'] === null) {
        $missingFields[] = 'استان (cityCode)';
        $errors['cityCode'] = 'انتخاب استان الزامی است';
    } else {
        $allowedCityCodes = ['13', '14', '15', 13, 14, 15];
        if (!in_array($data['cityCode'], $allowedCityCodes, true)) {
            $invalidFields[] = 'استان';
            $errors['cityCode'] = sprintf(
                'استان نامعتبر. مقدار وارد شده: %s - مقادیر مجاز: تهران (13)، اصفهان (14)، شیراز (15)',
                $data['cityCode']
            );
        }
    }

    // Check name
    if (empty($data['name'])) {
        $missingFields[] = 'نام مشتری (name)';
        $errors['name'] = 'وارد کردن نام مشتری الزامی است';
    }

    // Build dynamic message
    $message = 'اطلاعات معتبر است';

    if (!empty($errors)) {
        $parts = [];

        if (!empty($missingFields)) {
            $parts[] = sprintf('فیلدهای الزامی وارد نشده: %s', implode('، ', $missingFields));
        }

        if (!empty($invalidFields)) {
            $parts[] = sprintf('فیلدهای نامعتبر: %s', implode('، ', $invalidFields));
        }

        $message = implode(' | ', $parts);
    }

    return [
        'valid' => empty($errors),
        'message' => $message,
        'errors' => $errors,
        'errorCount' => count($errors)
    ];
}










/* 
 | -----------------------
 |  تابع برای خواندن توکن از فایل
 | -----------------------
 */
function getValidToken(): string
{
    $tokenData = holooLogin(false);

    if (empty($tokenData['token'])) {
        jsonResponse([
            'status' => 'error',
            'message' => 'token not available'
        ], 500);
    }

    return $tokenData['token'];
}








/* 
 | -----------------------
 |  تابع دریافت و ذخیره توکن
 | -----------------------
 */
function holooLogin($force = false): array
{
    global $TOKEN_FILE, $BASE_URL, $holoo_USERNAME, $holoo_PASSWORD, $holoo_DBNAME, $DEBUG_FILES_LOG;
    $path = '/api/Login';
    if (!$force && file_exists($TOKEN_FILE)) {
        $cached = loadJsonFile($TOKEN_FILE);
        if (!empty($cached['token'])) {
            return $cached;
        }
    }

    $url = $BASE_URL . $path;

    $payload = [
        'userinfo' => [
            'username' => $holoo_USERNAME,
            'userpass' => $holoo_PASSWORD,
            'dbname' => $holoo_DBNAME,
        ]
    ];



    $response = curlRequest(
        $url,
        'POST',
        [
            'Accept: application/json',
            'Content-Type: application/json',
        ],
        json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
    );

    writeLog($DEBUG_FILES_LOG, '[LOGIN 502] response', $response['body']);

    if (!empty($response['curl_error'])) {
        jsonResponse([
            'status' => 'error',
            'message' => 'holoo login curl error',
            'error' => $response['curl_error'],
            'curl_errno' => $response['curl_errno'] ?? null,
            'url' => $url
        ], 502);
    }

    $decoded = json_decode($response['body'], true);

    writeLog($DEBUG_FILES_LOG, '[LOGIN 519] decoded', $decoded);

    if (!is_array($decoded) || empty($decoded['Login']['Token'])) {
        jsonResponse([
            'status' => 'error',
            'message' => 'holoo login failed',
            'http_code' => $response['http_code'],
            'raw' => $response['body'],
            'url' => $url
        ], 500);
    }

    $tokenData = [
        'token' => $decoded['Login']['Token'],
        'saved_at' => date('Y-m-d H:i:s')
    ];

    saveJsonFile($TOKEN_FILE, $tokenData);


    return $tokenData;
}









// =========================================
//    InvalidToken
// =========================================
function isHolooInvalidTokenResponse(array $decoded): bool
{
    if (!isset($decoded['Login']) || !is_array($decoded['Login'])) {
        return false;
    }

    $login = $decoded['Login'];

    $errorCode = isset($login['ErrorCode']) ? (int)$login['ErrorCode'] : null;
    $errorText = isset($login['Error']) ? trim(strtolower($login['Error'])) : '';
    $state = isset($login['State']) ? trim(strtolower($login['State'])) : '';

    return (
        $state === 'false' &&
        (
            $errorCode === 2 ||
            $errorText === 'invalid token'
        )
    );
}










// =========================================
// [ORDER HELPERS]
// =========================================

function getRequestBodyAsArray(): array
{
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw, true);

    if (!is_array($decoded)) {
        jsonResponse([
            'success' => false,
            'message' => 'بدنه درخواست JSON معتبر نیست',
            'raw' => $raw
        ], 400);
    }

    return $decoded;
}





// =========================================
// نرمالیزه کردن مقدار موبایل
// =========================================
function normalizeMobile($mobile): string
{
    $mobile = preg_replace('/\D+/', '', (string) $mobile);

    if (str_starts_with($mobile, '98') && strlen($mobile) === 12) {
        $mobile = '0' . substr($mobile, 2);
    }

    return $mobile;
}







// =========================================
// جستجوی کاربر توسط شماره موبایل
// =========================================
function findExpertByMobile(array $rows, string $mobile): ?array
{
    foreach ($rows as $row) {
        $rowMobile = normalizeMobile($row['Mobile'] ?? $row['mobile'] ?? '');

        if ($rowMobile === $mobile) {
            return $row;
        }
    }

    return null;
}








// =========================================
// چستجوی کارشناس توسط شماره موبایل
// =========================================
function findAuthExpertByMobile(array $rows, string $mobile): ?array
{
    foreach ($rows as $row) {
        $rowMobile = normalizeMobile($row['Mobile'] ?? $row['mobile'] ?? '');

        if ($rowMobile === $mobile) {
            return $row;
        }
    }

    return null;
}








// =========================================
// مپ پیلود کارشناس ارسالی از فرانت اند
// =========================================
function mapExpertAuthPayload(array $authExpert, string $mobile): array
{
    
    return [
        'code' => (string) ($authExpert['Code'] ?? $authExpert['code'] ?? ''),
        'name' => (string) ($authExpert['Name'] ?? $authExpert['name'] ?? ''),
        'role' => (string) ($authExpert['role'] ?? $authExpert['role'] ?? ''),
        'mobile' => $mobile,
    ];
}








// =========================================
// 
// =========================================
function getExpertsRows(array $data): array
{
    $rows = $data['expert'] ?? [];

    return is_array($rows) ? $rows : [];
}










// =========================================
// 
// =========================================
function getAuthRows(array $data): array
{
    $rows = $data['data'] ?? [];

    return is_array($rows) ? $rows : [];
}





// =========================================
// 
// =========================================


// =========================================
// 
// =========================================