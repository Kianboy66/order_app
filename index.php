<?php

require_once './config/app.php';
require_once './src/Helpers/ApiResponse.php';
require_once './src/Controllers/controller.php';
require_once './src/Helpers/Logger.php';





/* ===== ساخت دایرکتوری data ===== */
if (!is_dir($DATA_DIR)) {
    mkdir($DATA_DIR, 0775, true);
}



/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/
if ($uri === '/api/ok') {
    jsonResponse([
        'status' => 'ok',
        'message' => 'PHP raw API is running'
    ]);
}




/*
|--------------------------------------------------------------------------
| Root Route
|--------------------------------------------------------------------------
*/
if ($uri === '') {
    redirect_if($uri);
    exit;
}





/*
|--------------------------------------------------------------------------
| holoo Login
|--------------------------------------------------------------------------
*/
if ($uri === '/api/login') {
    $path = '/api/Login';
    $url = $BASE_URL . $path;
    $tokenData = holooLogin(true);

    $token = loadJsonFile($TOKEN_FILE);

    jsonResponse([
        'status' => 'ok',
        'token_saved' => !file_exists($TOKEN_FILE),
        'token' => $token,
        'has_token' => !empty($tokenData['token']),
    ]);
}




/*
|--------------------------------------------------------------------------
| Product Sync
|--------------------------------------------------------------------------
*/
if ($uri === '/api/Product/sync') {
    $token = getValidToken();

    $path = '/api/Product?mainGroupErpCode=bBAHfg==';
    $holooResponse = holooGet($path, $token);

    $productList = $holooResponse['Product'] ?? $holooResponse['product'] ?? null;

    if (!is_array($productList)) {
        jsonResponse([
            'status' => 'error',
            'message' => 'invalid product response',
            'raw' => $holooResponse
        ], 500);
        exit;
    }

    $savedCount = saveProductsToDb($productList);
    $now = date('Y-m-d H:i:s');

    jsonResponse([
        'status' => 'ok',
        'message' => 'products synced',
        'count' => $savedCount,
        'updated_at' => $now
    ]);
    exit;
}




/*
|--------------------------------------------------------------------------
| Product Fetch
|--------------------------------------------------------------------------
*/
if ($uri === '/api/Product') {
    $data = getProductsFromDb();

    jsonResponse([
        'status' => 'ok',
        'product' => $data['product'],
        'count' => $data['count'],
        'updated_at' => $data['updated_at']
    ]);
    exit;
}








/*
|--------------------------------------------------------------------------
| [ORDER ROUTE] ثبت سفارش و ارسال به هلو
|--------------------------------------------------------------------------
*/
if ($method === 'POST' && $uri === '/api/Invoice/Order') {
    writeLog($ORDER_LOG_FILE, '[ORDER ROUTE 309] request started', [
        'uri' => $uri,
        'method' => $method,
    ]);

    $incomingPayload = getRequestBodyAsArray();
    writeLog($ORDER_LOG_FILE, '[ORDER ROUTE 315] incoming payload', $incomingPayload);

    $validation = validateIncomingOrderPayload($incomingPayload);

    if (!$validation['valid']) {
        writeLog($ORDER_LOG_FILE, '[ORDER ROUTE 320] validation failed', $validation);

        appendJsonFile($FAILED_ORDERS_FILE, [
            'created_at' => date('Y-m-d H:i:s'),
            'type' => 'validation_error',
            'payload' => $incomingPayload,
            'validation' => $validation
        ]);

        jsonResponse([
            'success' => $validation['valide'],
            'message' => $validation['message']
        ], 422);
    }

    $holooPayload = mapFrontendOrderToHolooPayload($incomingPayload);
    writeLog($ORDER_LOG_FILE, '[ORDER ROUTE 336] mapped payload', $holooPayload);


    $sendResult = sendOrderToHoloo($holooPayload);
    writeLog($ORDER_LOG_FILE, '[ORDER ROUTE 363] send result', $sendResult);

    if ($sendResult['success'] === false && ($sendResult['errorType'] ?? '') === 'network_error') {
        appendJsonFile($PENDING_ORDERS_FILE, [
            'created_at' => date('Y-m-d H:i:s'),
            'type' => 'pending_network_error',
            'payload' => $incomingPayload,
            'mapped_payload' => $holooPayload,
            'send_result' => $sendResult
        ]);


        jsonResponse([
            'success' => false,
            'message' => 'سرور حسابداری در دسترس نیست. سفارش در صف انتظار ذخیره شد.',
            'queued' => true
        ], 503);
    }

    if ($sendResult['success'] === false && ($sendResult['errorType'] ?? '') === 'business_error') {
        appendJsonFile($FAILED_ORDERS_FILE, [
            'created_at' => date('Y-m-d H:i:s'),
            'type' => 'send_error',
            'payload' => $incomingPayload,
            'mapped_payload' => $holooPayload,
            'send_result' => $sendResult
        ]);

        jsonResponse([
            'success' => false,
            'message' => $sendResult['message'] ?? 'خطا در ارسال سفارش. لطفا با پشتیبانی تماس بگیرید! کدخطا(8)'
        ], 500);
    }

    $decoded = $sendResult['decoded'] ?? [];

    if (!is_array($decoded)) {
        appendJsonFile($FAILED_ORDERS_FILE, [
            'created_at' => date('Y-m-d H:i:s'),
            'type' => 'invalid_holoo_response',
            'payload' => $incomingPayload,
            'mapped_payload' => $holooPayload,
            'decoded' => $decoded
        ]);
        writeLog($ORDER_LOG_FILE, '[ORDER ROUTE 383] send result decoded', $decoded);

        jsonResponse([
            'success' => false,
            'message' => 'پاسخ سرور حسابداری قابل پردازش نیست'
        ], 502);
    }

    $normalized = normalizeHolooOrderResponse($decoded);
    writeLog($ORDER_LOG_FILE, '[ORDER ROUTE 392] normalized response', $normalized);

    if (!empty($normalized['success'])) {

        $invoice = $holooPayload['invoiceinfo'][0] ?? [];

        appendJsonFile($SUCCESS_ORDERS_FILE, [
            'created_at' => date('Y-m-d H:i:s'),
            'retried' => $sendResult['retried'] ?? false,

            'order' => [
                'id' => $invoice['id'] ?? null,
                'customererpcode' => $invoice['customererpcode'] ?? null,
                'date' => $invoice['date'] ?? null,
                'time' => $invoice['time'] ?? null,
                'comment' => $invoice['comment'] ?? null,
            ],

            'items' => $invoice['detailinfo'] ?? [],

            'holoo' => [
                'orderNumber' => $normalized['orderNumber'] ?? null,
                'erpCode' => $normalized['erpCode'] ?? null,
            ]
        ]);
    }

    appendJsonFile($FAILED_ORDERS_FILE, [
        'created_at' => date('Y-m-d H:i:s'),
        'type' => 'holoo_business_error',
        'retried' => $sendResult['retried'] ?? false,
        'payload' => $incomingPayload,
        'mapped_payload' => $holooPayload,
        'holoo_response' => $decoded
    ]);

    jsonResponse(
        [
            'success' => false,
            'message' => $normalized['message'] ?? 'خطا در ثبت سفارش',
            'holoo' => $decoded
        ],
        422
    );
}











/*
|--------------------------------------------------------------------------
| Customer Sync (MySQL Version)
|--------------------------------------------------------------------------
*/
if ($uri === "/api/Customer/sync") {
    $token = getValidToken();
    $path = '/api/Customer?IsPurchaser=true';
    $holooResponse = holooGet($path, $token);

    $customerList = $holooResponse['Customer'] ?? $holooResponse['customer'] ?? null;

    if (!is_array($customerList)) {
        jsonResponse([
            'status' => 'error',
            'message' => 'invalid customer response',
            'raw' => $holooResponse
        ], 500);
        exit;
    }

    try {
        saveCustomersToDb($customerList);

        jsonResponse([
            'status' => 'ok',
            'message' => 'customers synced and saved to database',
            'count' => count($customerList),
            'updated_at' => date('Y-m-d H:i:s')
        ]);
    } catch (Exception $e) {
        jsonResponse([
            'status' => 'error',
            'message' => 'failed to save customers to database: ' . $e->getMessage()
        ], 500);
    }
    exit;
}










/*
|--------------------------------------------------------------------------
| Customer Fetch (MySQL Version)
|--------------------------------------------------------------------------
*/
if ($uri === '/api/Customers') {
    try {
        $data = getCustomersFromDb();

        jsonResponse([
            'status' => 'ok',
            'customer' => $data['customer'],
            'count' => $data['count'],
            'updated_at' => $data['updated_at']
        ]);
    } catch (Exception $e) {
        jsonResponse([
            'status' => 'error',
            'message' => 'failed to fetch customers from database: ' . $e->getMessage(),
            'customer' => [],
            'count' => 0,
            'updated_at' => null
        ], 500);
    }
    exit;
}






/*
|--------------------------------------------------------------------------
| ثبت مشتری نسخه معیوب
|--------------------------------------------------------------------------
*/
// if ($method === 'POST' && $uri === '/api/Customerold') {
//     $inputData = getRequestBodyAsArray();

//     writeLog($CUSTOMER_LOG_FILE, '[CUSTOMER CREATE] incoming payload', $inputData);

//     $validation = validateCustomerCreatePayload($inputData);
//     if (!$validation['valid']) {
//         writeLog($CUSTOMER_LOG_FILE, '[CUSTOMER CREATE] validation failed', $validation);

//         jsonResponse([
//             'success' => false,
//             'message' => $validation['message'],
//             'errors' => $validation['errors'] ?? []
//         ], 422);
//         exit;
//     }

//     $holooPayload = [
//         'custinfo' => [
//             $inputData
//         ]
//     ];

//     $url = $BASE_URL . $uri;
//     writeLog($CUSTOMER_LOG_FILE, '[CUSTOMER CREATE] url', ['url' => $url]);
//     writeLog($CUSTOMER_LOG_FILE, '[CUSTOMER CREATE] holoo payload', $holooPayload);

//     $token = getValidToken();
//     $authHeader = stripos($token, 'Bearer ') === 0 ? $token : 'Bearer ' . $token;

//     $response = curlRequest(
//         $url,
//         'POST',
//         [
//             'Accept: application/json',
//             'Content-Type: application/json',
//             'Authorization: ' . $authHeader,
//         ],
//         json_encode($holooPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
//     );


//     if (!empty($response['curl_error'])) {
//         jsonResponse([
//             'success' => false,
//             'errorType' => $response['curl_errno'],
//             'error' => $response['curl_error']
//         ], 503);
//         exit;
//     }

//     $decoded = json_decode($response['body'] ?? '', true);
//     writeLog($CUSTOMER_LOG_FILE, '[CUSTOMER CREATE] first response decoded', $decoded);


//     if (isHolooInvalidTokenResponse($decoded)) {


//         $newTokenData = holooLogin(true);
//         $newToken = getValidToken();

//         if ($newToken === '') {
//             jsonResponse([
//                 'success' => false,
//                 'errorType' => 'token_error',
//                 'error' => 'توکن جدید دریافت نشد'
//             ]);
//             exit;
//         }

//         // ارسال مجدد درخواست با توکن جدید
//         $retryResponse = curlRequest(
//             $url,
//             'POST',
//             [
//                 'Accept: application/json',
//                 'Content-Type: application/json',
//                 'Authorization: Bearer ' . $newToken,
//             ],
//             json_encode($holooPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
//         );

//         if (isset($retryResponse['success'])) {
//             syncCustomersInternal();
//             syncExpertsInternal();
//             jsonResponse([
//                 'status' => 'ok',
//                 'message' => 'مشتری با موفقیت ثبت و فایل‌ها همگام‌سازی شدند!',
//                 'holoo_response' => $response
//             ]);
//         }

//         writeLog($CUSTOMER_LOG_FILE, '[CUSTOMER] درخواست مجدد هست: ', $retryResponse);

//         if (!empty($retryResponse['curl_error'])) {
//             echo json_encode([
//                 'success' => false,
//                 'errorType' => 'network_error',
//                 'error' => $retryResponse['curl_error']
//             ]);
//             exit;
//         }

//         $decoded = json_decode($retryResponse['body'], true);
//         $response = $retryResponse; // آپدیت کردن ریسپانس خام برای خروجی نهایی
//     }
    


//     if (!is_array($decoded)) {
//         writeLog($CUSTOMER_LOG_FILE, '[CUSTOMER CREATE] invalid json response',  $decoded);

//         jsonResponse([
//             'success' => false,
//             'message' => $decoded['Header'] ?? null,
//             'raw' => $decoded[''] ?? null
//         ], 502);
//         exit;
//     }
//     writeLog($CUSTOMER_LOG_FILE, '[CUSTOMER CREATE] finaly response decoded', $decoded);
//     $normalized = normalizeHolooCustomerCreateResponse($decoded);



//     if (!empty($decoded['Success'])) {
//         $customerRecord = buildCustomerCacheRecord($inputData, $decoded, $normalized);

//         $saveResult = saveSingleCustomerToDb($customerRecord);

//         writeLog($CUSTOMER_LOG_FILE, '[CUSTOMER CREATE] cache save result', $saveResult);

//         jsonResponse([
//             'success' => true,
//             'message' => $normalized['message'] ?? 'مشتری با موفقیت ثبت شد',
//             'customer' => $customerRecord,
//             'cached' => !empty($saveResult['success']),
//             'holoo' => $decoded
//         ]);
//         exit;
//     }

//     jsonResponse([
//         'success' => false,
//         'message' => $normalized['message'] ?? 'ثبت مشتری در هلو ناموفق بود',
//         'holoo' => $decoded
//     ], 422);
//     exit;
// }




/*
|--------------------------------------------------------------------------
| ثبت مشتری جدید
|--------------------------------------------------------------------------
*/
if ($method === 'POST' && $uri === '/api/Customer') {
    $inputData = getRequestBodyAsArray();

    // Validation
    $validation = validateCustomerCreatePayload($inputData);
    if (!$validation['valid']) {
        writeLog($CUSTOMER_LOG_FILE, '[CUSTOMER CREATE] Validation failed', $validation['errors']);
        jsonResponse([
            'success' => false,
            'message' => $validation['message'],
            'errors' => $validation['errors']
        ], 422);
        exit;
    }

    // Prepare payload
    $holooPayload = ['custinfo' => [$inputData]];
    $url = $BASE_URL . $uri;

    // First attempt
    $token = getValidToken();
    $response = sendCustomerRequest($url, $holooPayload, $token);

    // Handle cURL errors
    if (!empty($response['curl_error'])) {
        writeLog($CUSTOMER_LOG_FILE, '[CUSTOMER CREATE] cURL error', [
            'error' => $response['curl_error'],
            'errno' => $response['curl_errno']
        ]);
        jsonResponse([
            'success' => false,
            'errorType' => 'network_error',
            'error' => 'خطا در اتصال به سرور ! بعدا دوباره امنحان کنید.'
        ], 503);
        exit;
    }

    $decoded = json_decode($response['body'] ?? '', true);

    // Handle invalid token → Retry once
    if (isHolooInvalidTokenResponse($decoded)) {
        writeLog($CUSTOMER_LOG_FILE, '[CUSTOMER CREATE] Token expired, retrying...');

        holooLogin(true); // Force refresh
        $newToken = getValidToken();

        if ($newToken === '') {
            jsonResponse([
                'success' => false,
                'errorType' => 'token_error',
                'error' => 'عدم دریافت توکن جدید'
            ]);
            exit;
        }

        $response = sendCustomerRequest($url, $holooPayload, $newToken);

        if (!empty($response['curl_error'])) {
            jsonResponse([
                'success' => false,
                'errorType' => 'network_error',
                'error' => $response['curl_error']
            ], 503);
            exit;
        }

        $decoded = json_decode($response['body'], true);
    }

    // Validate JSON response
    if (!is_array($decoded) || empty($decoded['Header'])) {
        writeLog($CUSTOMER_LOG_FILE, '[CUSTOMER CREATE] Invalid response format', $decoded);
        jsonResponse([
            'success' => false,
            'message' => 'پاسخ نامعتبر از سرور هلو',
            'raw' => $response['body'] ?? null
        ], 502);
        exit;
    }

    // Success case
    if (!empty($decoded['Success'])) {
        $successData = $decoded['Success'];

        $customerRecord = [
            ...$inputData,
            'ErpCode' => $successData['ErpCode'] ?? null,
            'Code' => $successData['Code'] ?? null,
            'BedSarfasl' => $successData['BedSarfasl'] ?? null,
            '_customer_key' => $successData['ErpCode'] ?? md5(json_encode($inputData)),
            '_created_at' => date('Y-m-d H:i:s'),
            '_source' => 'create_customer_api'
        ];

        $saveResult = saveSingleCustomerToDb($customerRecord);

        jsonResponse([
            'success' => true,
            'message' => 'مشتری با موفقیت ثبت شد',
            'customer' => [
                'id' => $inputData['id'],
                'erpCode' => $successData['ErpCode'] ?? null,
                'code' => $successData['Code'] ?? null,
                'name' => $inputData['name'],
                'mobile' => $inputData['mobile']
            ],
            'cached' => !empty($saveResult['success'])
        ]);
        exit;
    }

    // Failure case
    if (!empty($decoded['Failure'])) {
        $failureData = $decoded['Failure'];

        writeLog($CUSTOMER_LOG_FILE, '[CUSTOMER CREATE] Holoo rejection', [
            'errorCode' => $failureData['ErrorCode'] ?? null,
            'error' => $failureData['Error'] ?? null,
            'customerId' => $failureData['Id'] ?? null
        ]);

        jsonResponse([
            'success' => false,
            'message' => $failureData['Error'] ?? 'خطای نامشخص در ثبت مشتری',
            'errorCode' => $failureData['ErrorCode'] ?? null,
            'existingCode' => $failureData['ExistingCustomerErpCode'] ?? null
        ], 422);
        exit;
    }

    // Unknown response structure
    writeLog($CUSTOMER_LOG_FILE, '[CUSTOMER CREATE] Unknown response structure', $decoded);
    jsonResponse([
        'success' => false,
        'message' => 'ساختار پاسخ نامشخص از سرور هلو'
    ], 502);
    exit;
}

/**
 * ارسال درخواست ثبت مشتری به Holoo
 */
function sendCustomerRequest(string $url, array $payload, string $token): array
{
    $authHeader = stripos($token, 'Bearer ') === 0 ? $token : 'Bearer ' . $token;

    return curlRequest(
        $url,
        'POST',
        [
            'Accept: application/json',
            'Content-Type: application/json',
            'Authorization: ' . $authHeader,
        ],
        json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
    );
}








/*
|--------------------------------------------------------------------------
| Expert sync
|--------------------------------------------------------------------------
*/
if ($uri === '/api/Expert/sync') {
    global $EXPERTS_FILE;

    $token = getValidToken();
    $path = '/api/Customer?IsVaseteh=true';
    $holooResponse = holooGet($path, $token);

    $expertList = $holooResponse['Customer'] ?? $holooResponse['customer'] ?? null;

    if (!is_array($expertList)) {
        jsonResponse([
            'status' => 'error',
            'message' => 'invalid experts response',
            'raw' => $holooResponse
        ], 500);
        exit;
    }

    saveJsonFile($EXPERTS_FILE, [
        'expert' => $expertList,
        'updated_at' => date('Y-m-d H:i:s'),
        'count' => count($expertList)
    ]);

    jsonResponse([
        'status' => 'ok',
        'message' => 'expert synced',
        'count' => count($expertList),
        'updated_at' => date('Y-m-d H:i:s')
    ]);
    exit;
}







/*
|--------------------------------------------------------------------------
| Expert fetch
|--------------------------------------------------------------------------
*/
if ($uri === "/api/Expert") {
    global $EXPERTS_FILE;

    if (!file_exists($EXPERTS_FILE)) {
        jsonResponse([
            'status' => 'ok',
            'expert' => [],
            'count' => 0,
            'updated_at' => null
        ]);
        exit;
    }
    $json = file_get_contents($EXPERTS_FILE);
    $data = json_decode($json, true);

    if (!is_array($data)) {
        jsonResponse([
            'status' => 'error',
            'message' => 'expert file is invalid',
            'expert' => []
        ], 500);
        exit;
    }
    jsonResponse([
        'status' => 'ok',
        'expert' => $data['expert'] ?? [],
        'count' => $data['count'] ?? count($data['expert'] ?? []),
        'updated_at' => $data['updated_at'] ?? null
    ]);
    exit;
}






/*
|--------------------------------------------------------------------------
| Auth_Expert fetch
|--------------------------------------------------------------------------
*/
if ($method === 'POST' && $uri === '/api/Auth/Expert') {
    $input = json_decode(file_get_contents('php://input'), true);
    global $EXPERTS_FILE, $Auth_EXPERTS_FILE;
    if (!is_array($input)) {
        jsonResponse([
            'success' => false,
            'message' => 'بدنه درخواست JSON معتبر نیست.',
        ], 400);
    }

    $mobile = normalizeMobile($input['mobile'] ?? '');

    if ($mobile === '') {
        jsonResponse([
            'success' => false,
            'message' => 'شماره موبایل الزامی است.',
        ], 422);
    }

    if (!preg_match('/^09\d{9}$/', $mobile)) {
        jsonResponse([
            'success' => false,
            'message' => 'شماره موبایل معتبر نیست.',
        ], 422);
    }


    $customersData = loadJsonFile($EXPERTS_FILE);
    $expertRows = getExpertsRows($customersData);

    if (!$expertRows) {
        jsonResponse([
            'success' => false,
            'message' => 'لیست کارشناسان خالی است.',
        ], 500);
    }

    $expert = findExpertByMobile($expertRows, $mobile);

    if (!$expert) {
        jsonResponse([
            'success' => false,
            'message' => 'کارشناس با این شماره موبایل یافت نشد.',
        ], 404);
    }

    $authData = loadJsonFile($Auth_EXPERTS_FILE);
    $authRows = getAuthRows($authData);
    $authExpert = findAuthExpertByMobile($authRows, $mobile);

    jsonResponse([
        'success' => true,
        'status' => $authExpert ? 'needs_login' : 'needs_register',
        'expert' => mapExpertAuthPayload($expert, $mobile),
    ]);
}







/*
|--------------------------------------------------------------------------
| Auth_Expert login or register
|--------------------------------------------------------------------------
*/
if ($method === 'POST' && $uri === '/api/Auth/Expert/Register') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
    global $EXPERTS_FILE, $Auth_EXPERTS_FILE;
        $mobile = $input['mobile'] ?? '';
        $password = $input['password'] ?? '';

        $mobile = normalizeMobile($mobile);

        if (!$mobile) {
            jsonResponse([
                'success' => false,
                'message' => 'شماره موبایل معتبر نیست.'
            ], 400);
        }

        if (!$password || mb_strlen($password) < 4) {
            jsonResponse([
                'success' => false,
                'message' => 'رمز عبور باید حداقل ۴ کاراکتر باشد.'
            ], 400);
        }



        $customersJson = loadJsonFile($EXPERTS_FILE);
        $experts = getExpertsRows($customersJson);

        $expert = findExpertByMobile($experts, $mobile);

        if (!$expert) {
            jsonResponse([
                'success' => false,
                'message' => 'کارشناس با این شماره موبایل یافت نشد.',
                'expert' => null
            ], 404);
        }

        $authJson = loadJsonFile($Auth_EXPERTS_FILE);

        if (!isset($authJson['data']) || !is_array($authJson['data'])) {
            $authJson['data'] = [];
        }

        $exists = findAuthExpertByMobile($authJson['data'], $mobile);

        if ($exists) {
            jsonResponse([
                'success' => false,
                'message' => 'این کارشناس قبلاً ثبت‌نام کرده است.'
            ], 409);
        }

        $payloadExpert = mapExpertAuthPayload($expert, $mobile);

        $authJson['data'][] = [
            'mobile' => $mobile,
            'code' => $payloadExpert['code'] ?? '',
            'name' => $payloadExpert['name'],
            'password' => password_hash($password, PASSWORD_DEFAULT),
            'role' => $payloadExpert['rule'],
            'registeredAt' => date('c')
        ];

        $saved = file_put_contents(
            $Auth_EXPERTS_FILE,
            json_encode($authJson, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT),
            LOCK_EX
        );

        if ($saved === false) {
            jsonResponse([
                'success' => false,
                'message' => 'خطا در ذخیره اطلاعات ثبت‌نام.'
            ], 500);
        }
        $authExpert = findAuthExpertByMobile($authJson['data'], $mobile);
        $payloadExpert = mapExpertAuthPayload($authExpert, $mobile);

        jsonResponse([
            'success' => true,
            'message' => 'ثبت‌نام با موفقیت انجام شد.',
            'expert' => $payloadExpert
        ], 201);
    } catch (Throwable $e) {
        jsonResponse([
            'success' => false,
            'message' => 'خطای سرور در ثبت‌نام کارشناس.'
        ], 500);
    }
}













/*
|--------------------------------------------------------------------------
| Auth_Expert Login
|--------------------------------------------------------------------------
*/
if ($method === 'POST' && $uri === '/api/Auth/Expert/Login') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        global $EXPERTS_FILE, $Auth_EXPERTS_FILE;

        $mobile = $input['mobile'] ?? '';
        $password = $input['password'] ?? '';

        $mobile = normalizeMobile($mobile);

        if (!$mobile) {
            jsonResponse([
                'success' => false,
                'message' => 'شماره موبایل معتبر نیست.'
            ], 400);
        }

        if (!$password) {
            jsonResponse([
                'success' => false,
                'message' => 'رمز عبور وارد نشده است.'
            ], 400);
        }



        $customersJson = loadJsonFile($EXPERTS_FILE);
        $experts = getExpertsRows($customersJson);

        $expert = findExpertByMobile($experts, $mobile);

        if (!$expert) {
            jsonResponse([
                'success' => false,
                'message' => 'کارشناس با این شماره موبایل یافت نشد.',
                'expert' => null
            ], 404);
        }

        if (!file_exists($Auth_EXPERTS_FILE)) {
            jsonResponse([
                'success' => false,
                'message' => 'این کارشناس هنوز ثبت‌نام نکرده است.'
            ], 404);
        }

        $authJson = loadJsonFile($Auth_EXPERTS_FILE);
        $authRows = getAuthRows($authJson);

        $authExpert = findAuthExpertByMobile($authRows, $mobile);

        if (!$authExpert) {
            jsonResponse([
                'success' => false,
                'message' => 'این کارشناس هنوز ثبت‌نام نکرده است.'
            ], 404);
        }

        $storedPassword = $authExpert['password'] ?? '';

        if (!$storedPassword || !password_verify($password, $storedPassword)) {
            jsonResponse([
                'success' => false,
                'message' => 'رمز عبور اشتباه است.'
            ], 401);
        }

        $payloadExpert = mapExpertAuthPayload($authExpert, $mobile);

        jsonResponse([
            'success' => true,
            'message' => 'ورود با موفقیت انجام شد.',
            'expert' => $payloadExpert
        ], 200);
    } catch (Throwable $e) {
        jsonResponse([
            'success' => false,
            'message' => 'خطای سرور در ورود کارشناس.'
        ], 500);
    }
}










/*
|--------------------------------------------------------------------------
| Auth_Expert fetch
|--------------------------------------------------------------------------
*/







/*
|--------------------------------------------------------------------------
| Auth_Expert fetch
|--------------------------------------------------------------------------
*/
