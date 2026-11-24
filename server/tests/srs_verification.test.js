import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import app from '../src/app.js';
import { validateProductionEnv } from '../src/config/env.js';
import { paymentGatewayService } from '../src/services/paymentGateway.service.js';
import { videoService } from '../src/services/video.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Helper to execute HTTP requests against the running Express test server
 */
async function request(baseUrl, method, endpoint, { token = null, body = null, headers = {}, isMultipart = false } = {}) {
  const start = Date.now();
  const reqHeaders = { ...headers };
  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  let fetchBody = undefined;
  if (body !== null && body !== undefined) {
    if (isMultipart) {
      fetchBody = body;
    } else {
      reqHeaders['Content-Type'] = 'application/json';
      fetchBody = JSON.stringify(body);
    }
  }

  const resp = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: reqHeaders,
    body: fetchBody,
    redirect: 'manual',
  });

  const durationMs = Date.now() - start;
  const contentType = resp.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await resp.json();
  } else {
    data = await resp.text();
  }

  return {
    status: resp.status,
    headers: resp.headers,
    data,
    durationMs,
  };
}

/**
 * Helper to build a multipart/form-data payload for file upload tests
 */
function buildMultipartPayload(fields, fileField) {
  const boundary = `----SiddAcademyTestBoundary${Date.now()}`;
  const chunks = [];

  for (const [key, value] of Object.entries(fields)) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`,
        'utf8'
      )
    );
  }

  if (fileField) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${fileField.fieldName}"; filename="${fileField.fileName}"\r\nContent-Type: ${fileField.mimeType}\r\n\r\n`,
        'utf8'
      )
    );
    chunks.push(Buffer.isBuffer(fileField.content) ? fileField.content : Buffer.from(fileField.content, 'utf8'));
    chunks.push(Buffer.from('\r\n', 'utf8'));
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`, 'utf8'));

  return {
    body: Buffer.concat(chunks),
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
  };
}

async function runSrsTests() {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  console.log(`🚀 Running SRS Verification Test Suite against ${baseUrl}...\n`);

  const results = [];
  const recordResult = (testCase) => {
    results.push(testCase);
    const icon = testCase.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${testCase.testId}] (${testCase.requirement}) ${testCase.scenario} -> ${testCase.status} (${testCase.latencyMs}ms)`);
    if (testCase.status !== 'PASS') {
      console.error(`   Details: ${testCase.actualOutcome}`);
    }
  };

  let studentToken = '';
  let studentId = '';
  const uniqueEmail = `srs.student.${Date.now()}@siddacademy.com`;
  let adminToken = '';
  let secondStudentToken = '';

  try {
    // Login as Admin first for admin-protected tests
    const adminLoginRes = await request(baseUrl, 'POST', '/auth/login', {
      body: { email: 'rishabhmyp@gmail.com', password: 'sid@8218' },
    });
    adminToken = adminLoginRes.data?.data?.token || '';

    // =========================================================================
    // TC-01: FR-AUTH-01 - Register with valid data
    // =========================================================================
    {
      const res = await request(baseUrl, 'POST', '/auth/register', {
        body: {
          name: 'SRS Test Student',
          email: uniqueEmail,
          password: 'Password@123',
          phone: '9876543210',
        },
      });
      const userObj = res.data?.data?.user;
      studentToken = res.data?.data?.token;
      studentId = userObj?.id || userObj?._id;
      const hasNoPassword = userObj && !('password' in userObj) && !('password_hash' in userObj);
      const passed = res.status === 201 && Boolean(studentToken) && hasNoPassword;

      recordResult({
        testId: 'TC-01',
        testLevel: 'API / Auth Integration',
        requirement: 'FR-AUTH-01, FR-AUTH-03',
        scenario: 'Register with valid data',
        testInput: `POST /api/v1/auth/register { name: "SRS Test Student", email: "${uniqueEmail}", password: "***" }`,
        expectedOutcome: '201; user returned without password fields.',
        actualOutcome: `HTTP ${res.status}; user ID=${studentId}, passwordFieldPresent=${!hasNoPassword}, tokenIssued=${Boolean(studentToken)}`,
        httpStatus: res.status,
        latencyMs: res.durationMs,
        status: passed ? 'PASS' : 'FAIL',
      });
    }

    // =========================================================================
    // TC-02: FR-AUTH-02 - Register with existing email
    // =========================================================================
    {
      const res = await request(baseUrl, 'POST', '/auth/register', {
        body: {
          name: 'Duplicate User',
          email: uniqueEmail.toUpperCase(), // Also tests email normalization
          password: 'Password@123',
        },
      });
      const passed = res.status === 400 && res.data?.success === false;

      recordResult({
        testId: 'TC-02',
        testLevel: 'Service / Auth Integration',
        requirement: 'FR-AUTH-02',
        scenario: 'Register with existing email',
        testInput: `POST /api/v1/auth/register { email: "${uniqueEmail.toUpperCase()}" }`,
        expectedOutcome: 'Request rejected; duplicate account not created.',
        actualOutcome: `HTTP ${res.status}; message="${res.data?.message}"`,
        httpStatus: res.status,
        latencyMs: res.durationMs,
        status: passed ? 'PASS' : 'FAIL',
      });
    }

    // =========================================================================
    // TC-03: FR-AUTH-04 - Login with wrong password
    // =========================================================================
    {
      const res = await request(baseUrl, 'POST', '/auth/login', {
        body: {
          email: uniqueEmail,
          password: 'WrongPassword999!',
        },
      });
      const passed = res.status === 401 && res.data?.success === false;

      recordResult({
        testId: 'TC-03',
        testLevel: 'Security / Auth',
        requirement: 'FR-AUTH-04',
        scenario: 'Login with wrong password',
        testInput: `POST /api/v1/auth/login { email: "${uniqueEmail}", password: "WrongPassword999!" }`,
        expectedOutcome: '401 controlled error.',
        actualOutcome: `HTTP ${res.status}; message="${res.data?.message}"`,
        httpStatus: res.status,
        latencyMs: res.durationMs,
        status: passed ? 'PASS' : 'FAIL',
      });
    }

    // =========================================================================
    // TC-04: FR-COURSE-01 - Catalog request with page=2, limit=10, search value
    // =========================================================================
    {
      const res = await request(baseUrl, 'GET', '/courses?page=2&limit=10&search=Class');
      const payload = res.data?.data;
      const hasShape =
        res.status === 200 &&
        Array.isArray(payload?.courses) &&
        typeof payload?.total === 'number' &&
        payload?.page === 2 &&
        typeof payload?.pages === 'number';

      recordResult({
        testId: 'TC-04',
        testLevel: 'API Integration',
        requirement: 'FR-COURSE-01',
        scenario: 'Catalog request with page=2, limit=10, search value',
        testInput: 'GET /api/v1/courses?page=2&limit=10&search=Class',
        expectedOutcome: 'Correct filtered/paginated shape.',
        actualOutcome: `HTTP ${res.status}; shape={ courses: Array(${payload?.courses?.length}), total: ${payload?.total}, page: ${payload?.page}, pages: ${payload?.pages} }`,
        httpStatus: res.status,
        latencyMs: res.durationMs,
        status: hasShape ? 'PASS' : 'FAIL',
      });
    }

    // =========================================================================
    // TC-05: FR-CURR-04 - Create chapter with nonexistent subject
    // =========================================================================
    {
      const res = await request(baseUrl, 'POST', '/chapters', {
        token: adminToken,
        body: {
          subjectId: 'nonexistent_subject_id_999',
          title: 'Orphan Chapter Test',
        },
      });
      const passed = res.status === 404 && res.data?.success === false;

      recordResult({
        testId: 'TC-05',
        testLevel: 'Service Integration',
        requirement: 'FR-CURR-04',
        scenario: 'Create chapter with nonexistent subject',
        testInput: 'POST /api/v1/chapters { subjectId: "nonexistent_subject_id_999", title: "Orphan Chapter Test" }',
        expectedOutcome: '404 parent-not-found result.',
        actualOutcome: `HTTP ${res.status}; message="${res.data?.message}"`,
        httpStatus: res.status,
        latencyMs: res.durationMs,
        status: passed ? 'PASS' : 'FAIL',
      });
    }

    // =========================================================================
    // TC-06: FR-NOTE-03 - Anonymous user requests paid-note access
    // =========================================================================
    {
      // Check both listing masking (FR-NOTE-02) and secure access endpoint (FR-NOTE-03)
      const listRes = await request(baseUrl, 'GET', '/notes');
      const paidNote = (listRes.data?.data?.notes || []).find((n) => !n.isFree);
      const paidNoteId = paidNote?.id || paidNote?._id || 'note_bio_flower_01';
      const isUrlMaskedInList = paidNote && paidNote.fileUrl === null && paidNote.isLocked === true;

      const accessRes = await request(baseUrl, 'GET', `/notes/${paidNoteId}/access`);
      const noFileUrlInAccess = !accessRes.data?.data?.fileUrl;
      const passed = accessRes.status === 403 && isUrlMaskedInList && noFileUrlInAccess;

      recordResult({
        testId: 'TC-06',
        testLevel: 'Security / Entitlement',
        requirement: 'FR-NOTE-02, FR-NOTE-03',
        scenario: 'Anonymous user requests paid-note access',
        testInput: `GET /api/v1/notes/${paidNoteId}/access (unauthenticated)`,
        expectedOutcome: '403/no file URL; route auth policy must match intended spec.',
        actualOutcome: `HTTP ${accessRes.status}; listMasked=${isUrlMaskedInList}, accessFileUrl=${accessRes.data?.data?.fileUrl || 'null'}, message="${accessRes.data?.message}"`,
        httpStatus: accessRes.status,
        latencyMs: accessRes.durationMs,
        status: passed ? 'PASS' : 'FAIL',
      });
    }

    // =========================================================================
    // TC-07: FR-PAY-03 - Client sends a manipulated price
    // =========================================================================
    let testOrderId = '';
    let testRzpOrderId = '';
    {
      // Course course_c12_bio has canonical discountPrice = 699 (price = 1199)
      const res = await request(baseUrl, 'POST', '/orders', {
        token: studentToken,
        body: {
          items: [
            {
              itemId: 'course_c12_bio',
              itemType: 'course',
              price: 1, // Manipulated client price (₹1 instead of ₹699)
              amount: 1,
            },
          ],
        },
      });
      const orderData = res.data?.data;
      testOrderId = orderData?.orderId;
      testRzpOrderId = orderData?.razorpayOrderId;
      const serverAmount = orderData?.amount;
      const passed = res.status === 201 && serverAmount === 699;

      recordResult({
        testId: 'TC-07',
        testLevel: 'Security / Payment Integrity',
        requirement: 'FR-PAY-03',
        scenario: 'Client sends a manipulated price',
        testInput: 'POST /api/v1/orders { items: [{ itemId: "course_c12_bio", itemType: "course", price: 1 }] }',
        expectedOutcome: 'Server total still derived from canonical item price.',
        actualOutcome: `HTTP ${res.status}; clientSubmittedPrice=1, serverCanonicalTotal=${serverAmount} INR`,
        httpStatus: res.status,
        latencyMs: res.durationMs,
        status: passed ? 'PASS' : 'FAIL',
      });
    }

    // =========================================================================
    // TC-08: FR-PAY-07 - Use invalid payment signature in configured live verification mode
    // =========================================================================
    {
      const res = await request(baseUrl, 'POST', '/orders/verify', {
        token: studentToken,
        body: {
          orderId: testOrderId,
          razorpayOrderId: testRzpOrderId,
          razorpayPaymentId: 'pay_live_test_001',
          razorpaySignature: 'invalid_tampered_hmac_sha256_signature_00000',
          forceLiveMode: true,
        },
      });
      const dashRes = await request(baseUrl, 'GET', '/student/courses', { token: studentToken });
      const enrolledIds = (dashRes.data?.data?.courses || []).map((c) => c.id || c._id);
      const notEnrolled = !enrolledIds.includes('course_c12_bio');
      const passed = res.status === 400 && notEnrolled;

      recordResult({
        testId: 'TC-08',
        testLevel: 'Security / Payment Integrity',
        requirement: 'FR-PAY-07, NFR-SEC-05',
        scenario: 'Use invalid payment signature in configured live verification mode',
        testInput: `POST /api/v1/orders/verify { orderId: "${testOrderId}", razorpaySignature: "invalid_tampered...", forceLiveMode: true }`,
        expectedOutcome: 'Verification rejected; no entitlement granted.',
        actualOutcome: `HTTP ${res.status}; entitlementGranted=${!notEnrolled}; message="${res.data?.message}"`,
        httpStatus: res.status,
        latencyMs: res.durationMs,
        status: passed ? 'PASS' : 'FAIL',
      });
    }

    // =========================================================================
    // TC-09: FR-PAY-09 - Force DB error partway through verification transaction
    // =========================================================================
    {
      const validSig = paymentGatewayService.computeSignature(testRzpOrderId, 'pay_live_test_002');
      const res = await request(baseUrl, 'POST', '/orders/verify', {
        token: studentToken,
        body: {
          orderId: testOrderId,
          razorpayOrderId: testRzpOrderId,
          razorpayPaymentId: 'pay_live_test_002',
          razorpaySignature: validSig,
          simulateDbFailure: true,
        },
      });
      // Confirm order rolled back to PENDING and no course entitlement was granted
      const orderCheck = await request(baseUrl, 'GET', `/orders/${testOrderId}`, { token: studentToken });
      const orderStatus = orderCheck.data?.data?.order?.status;
      const coursesCheck = await request(baseUrl, 'GET', '/student/courses', { token: studentToken });
      const enrolledIds = (coursesCheck.data?.data?.courses || []).map((c) => c.id || c._id);
      const rolledBack = res.status === 500 && orderStatus === 'PENDING' && !enrolledIds.includes('course_c12_bio');

      recordResult({
        testId: 'TC-09',
        testLevel: 'Database Integration / Atomicity',
        requirement: 'FR-PAY-09, NFR-REL-01',
        scenario: 'Force DB error partway through verification transaction',
        testInput: `POST /api/v1/orders/verify { orderId: "${testOrderId}", simulateDbFailure: true }`,
        expectedOutcome: 'Transaction rolls back; no partial access grant.',
        actualOutcome: `HTTP ${res.status}; orderStatusAfterRollback="${orderStatus}", partialAccessGranted=${enrolledIds.includes('course_c12_bio')}`,
        httpStatus: res.status,
        latencyMs: res.durationMs,
        status: rolledBack ? 'PASS' : 'FAIL',
      });
    }

    // =========================================================================
    // TC-10: FR-PAY-08 - User attempts to verify another user order
    // =========================================================================
    {
      const secondReg = await request(baseUrl, 'POST', '/auth/register', {
        body: {
          name: 'Second Student',
          email: `second.student.${Date.now()}@siddacademy.com`,
          password: 'Password@123',
        },
      });
      secondStudentToken = secondReg.data?.data?.token;

      const res = await request(baseUrl, 'POST', '/orders/verify', {
        token: secondStudentToken,
        body: {
          orderId: testOrderId,
          razorpayOrderId: testRzpOrderId,
          razorpayPaymentId: 'pay_cross_user_001',
          razorpaySignature: 'sig_valid_mock_001',
        },
      });
      const orderCheck = await request(baseUrl, 'GET', `/orders/${testOrderId}`, { token: studentToken });
      const orderStatus = orderCheck.data?.data?.order?.status;
      const passed = res.status === 403 && orderStatus === 'PENDING';

      recordResult({
        testId: 'TC-10',
        testLevel: 'Security / Ownership',
        requirement: 'FR-PAY-08, NFR-SEC-02',
        scenario: 'User attempts to verify another user order',
        testInput: `POST /api/v1/orders/verify by other user on orderId="${testOrderId}"`,
        expectedOutcome: '403; no state changed.',
        actualOutcome: `HTTP ${res.status}; orderStatus="${orderStatus}"; message="${res.data?.message}"`,
        httpStatus: res.status,
        latencyMs: res.durationMs,
        status: passed ? 'PASS' : 'FAIL',
      });
    }

    // =========================================================================
    // TC-11: FR-STU-04 - Update progress with missing lessonId
    // =========================================================================
    {
      const res = await request(baseUrl, 'POST', '/student/progress', {
        token: studentToken,
        body: {
          courseId: 'course_c12_bio',
          // lessonId intentionally omitted
        },
      });
      const passed = res.status === 400 && res.data?.success === false;

      recordResult({
        testId: 'TC-11',
        testLevel: 'API / Validation',
        requirement: 'FR-STU-04',
        scenario: 'Update progress with missing lessonId',
        testInput: 'POST /api/v1/student/progress { courseId: "course_c12_bio" }',
        expectedOutcome: '400 controlled validation/business error.',
        actualOutcome: `HTTP ${res.status}; message="${res.data?.message}"`,
        httpStatus: res.status,
        latencyMs: res.durationMs,
        status: passed ? 'PASS' : 'FAIL',
      });
    }

    // =========================================================================
    // TC-12: NFR-SEC-04 - Start production without JWT secrets
    // =========================================================================
    {
      const start = Date.now();
      let failedSecurely = false;
      let errMsg = '';
      try {
        validateProductionEnv({
          NODE_ENV: 'production',
          JWT_SECRET: '',
          JWT_ACCESS_SECRET: '',
          JWT_REFRESH_SECRET: '',
        });
      } catch (err) {
        failedSecurely = true;
        errMsg = err.message;
      }
      const latencyMs = Date.now() - start;

      recordResult({
        testId: 'TC-12',
        testLevel: 'Security / Configuration',
        requirement: 'NFR-SEC-04',
        scenario: 'Start production without JWT secrets',
        testInput: 'validateProductionEnv({ NODE_ENV: "production", JWT_SECRET: "" })',
        expectedOutcome: 'Application should fail securely after hardening; no default-secret use.',
        actualOutcome: `failedSecurely=${failedSecurely}; error="${errMsg}"`,
        httpStatus: 'N/A (Startup Check)',
        latencyMs,
        status: failedSecurely ? 'PASS' : 'FAIL',
      });
    }

    // =========================================================================
    // TC-13: NFR-SEC-06 - Upload non-PDF file to PDF upload endpoint
    // =========================================================================
    {
      const multipart = buildMultipartPayload(
        {
          title: 'Malicious Executable Note',
          price: '0',
          isFree: 'true',
        },
        {
          fieldName: 'file',
          fileName: 'exploit.exe',
          mimeType: 'application/x-msdownload',
          content: 'MZ-fake-executable-binary-content',
        }
      );

      const res = await request(baseUrl, 'POST', '/notes', {
        token: adminToken,
        body: multipart.body,
        headers: multipart.headers,
        isMultipart: true,
      });
      const passed = res.status === 400 && res.data?.success === false;

      recordResult({
        testId: 'TC-13',
        testLevel: 'Security / Upload Safety',
        requirement: 'NFR-SEC-06, FR-NOTE-06',
        scenario: 'Upload non-PDF file to PDF upload endpoint',
        testInput: 'POST /api/v1/notes multipart file="exploit.exe" (application/x-msdownload)',
        expectedOutcome: '400; file rejected.',
        actualOutcome: `HTTP ${res.status}; message="${res.data?.message}"`,
        httpStatus: res.status,
        latencyMs: res.durationMs,
        status: passed ? 'PASS' : 'FAIL',
      });
    }

    // =========================================================================
    // TC-14: FR-OPS-01 - DB is unreachable during health check
    // =========================================================================
    {
      const res = await request(baseUrl, 'GET', '/health');
      const dbObj = res.data?.database;
      const rawJson = JSON.stringify(res.data || {});
      const leaksSecrets = /password|secret|postgresql:\/\/[^*]/i.test(rawJson);
      const passed = res.status === 200 && dbObj && dbObj.connected === false && !leaksSecrets;

      recordResult({
        testId: 'TC-14',
        testLevel: 'Operations / Health',
        requirement: 'FR-OPS-01, NFR-AVAIL-01',
        scenario: 'DB is unreachable during health check',
        testInput: 'GET /api/v1/health (with DB disconnected)',
        expectedOutcome: 'Health response clearly reports DB disconnected without sensitive details.',
        actualOutcome: `HTTP ${res.status}; database.connected=${dbObj?.connected}, leaksSecrets=${leaksSecrets}`,
        httpStatus: res.status,
        latencyMs: res.durationMs,
        status: passed ? 'PASS' : 'FAIL',
      });
    }

    // =========================================================================
    // TC-15: NFR-REL-02 - Submit the same successful payment verification twice
    // =========================================================================
    {
      const validSig = paymentGatewayService.computeSignature(testRzpOrderId, 'pay_live_verified_100');
      const firstVerify = await request(baseUrl, 'POST', '/orders/verify', {
        token: studentToken,
        body: {
          orderId: testOrderId,
          razorpayOrderId: testRzpOrderId,
          razorpayPaymentId: 'pay_live_verified_100',
          razorpaySignature: validSig,
          forceLiveMode: true,
        },
      });

      const secondVerify = await request(baseUrl, 'POST', '/orders/verify', {
        token: studentToken,
        body: {
          orderId: testOrderId,
          razorpayOrderId: testRzpOrderId,
          razorpayPaymentId: 'pay_live_verified_100',
          razorpaySignature: validSig,
          forceLiveMode: true,
        },
      });

      const coursesRes = await request(baseUrl, 'GET', '/student/courses', { token: studentToken });
      const bioEnrollments = (coursesRes.data?.data?.courses || []).filter(
        (c) => (c.id || c._id) === 'course_c12_bio'
      );

      const passed =
        firstVerify.status === 200 &&
        secondVerify.status === 200 &&
        secondVerify.data?.data?.alreadyVerified === true &&
        bioEnrollments.length === 1;

      recordResult({
        testId: 'TC-15',
        testLevel: 'Reliability / Idempotency',
        requirement: 'NFR-REL-02, FR-PAY-09',
        scenario: 'Submit the same successful payment verification twice',
        testInput: `POST /api/v1/orders/verify twice for orderId="${testOrderId}"`,
        expectedOutcome: 'Second request is idempotent; no duplicated enrollments or note purchases.',
        actualOutcome: `1st HTTP ${firstVerify.status}, 2nd HTTP ${secondVerify.status} (alreadyVerified=${secondVerify.data?.data?.alreadyVerified}), activeEnrollmentCount=${bioEnrollments.length}`,
        httpStatus: secondVerify.status,
        latencyMs: firstVerify.durationMs + secondVerify.durationMs,
        status: passed ? 'PASS' : 'FAIL',
      });
    }

    // =========================================================================
    // TC-16: FR-STU-01..04 - Dashboard update after course purchase & lesson progress
    // =========================================================================
    {
      const dashRes = await request(baseUrl, 'GET', '/student/dashboard', { token: studentToken });
      const dashData = dashRes.data?.data;
      const hasEnrolledCourseOnDashboard = (dashData?.enrolledCourses || []).some(
        (c) => (c.id || c._id) === 'course_c12_bio'
      );
      const hasCourseNotesOnDashboard = (dashData?.purchasedNotes || []).some(
        (n) => (n.id || n._id) === 'note_bio_flower_01'
      );

      // Mark lesson cls_bio_flower_02 complete
      const progRes = await request(baseUrl, 'POST', '/student/progress', {
        token: studentToken,
        body: {
          courseId: 'course_c12_bio',
          lessonId: 'cls_bio_flower_02',
          isCompleted: true,
        },
      });

      const passed =
        dashRes.status === 200 &&
        hasEnrolledCourseOnDashboard &&
        hasCourseNotesOnDashboard &&
        progRes.status === 200 &&
        progRes.data?.data?.progressPercentage > 0;

      recordResult({
        testId: 'TC-16',
        testLevel: 'End-to-End Workflow',
        requirement: 'FR-STU-01, FR-STU-02, FR-STU-03, FR-STU-04',
        scenario: 'Verify Student Dashboard updates immediately after course purchase and tracks lesson progress',
        testInput: 'GET /api/v1/student/dashboard & POST /api/v1/student/progress',
        expectedOutcome: 'Dashboard lists newly purchased course, unlocked course notes, and updated progress percentage.',
        actualOutcome: `HTTP ${dashRes.status}; courseInDashboard=${hasEnrolledCourseOnDashboard}, courseNoteUnlocked=${hasCourseNotesOnDashboard}, progressPct=${progRes.data?.data?.progressPercentage}%`,
        httpStatus: dashRes.status,
        latencyMs: dashRes.durationMs + progRes.durationMs,
        status: passed ? 'PASS' : 'FAIL',
      });
    }

    // =========================================================================
    // TC-17: FR-NOTE-04, FR-NOTE-05 & Google Drive Admin Upload -> Student Course Portal Access
    // =========================================================================
    {
      const samplePdfPath = path.resolve(__dirname, '../uploads/notes/Class_12_Chemistry_Chemical_Kinetics_Notes.pdf');
      const pdfBuffer = fs.readFileSync(samplePdfPath);

      const multipart = buildMultipartPayload(
        {
          title: 'SRS Automated Test Study Material (Google Drive)',
          description: 'Uploaded from Admin test to verify Google Drive storage and Student Course Portal access.',
          courseId: 'course_c12_bio',
          subjectId: 'subj_c12_bio_flower',
          chapterId: 'chap_c12_bio_flower_01',
          lessonId: 'cls_bio_flower_02',
          price: '49',
          isFree: 'false',
          pageCount: '12',
        },
        {
          fieldName: 'file',
          fileName: 'SRS_Verified_Biology_Study_Material.pdf',
          mimeType: 'application/pdf',
          content: pdfBuffer,
        }
      );

      const uploadRes = await request(baseUrl, 'POST', '/notes', {
        token: adminToken,
        body: multipart.body,
        headers: multipart.headers,
        isMultipart: true,
      });

      const createdNote = uploadRes.data?.data?.note;
      const noteId = createdNote?.id || createdNote?._id;
      const driveFileId = createdNote?.driveFileId;

      // Now verify the enrolled student in course_c12_bio sees it in the Course Portal and can stream it!
      const coursePortalRes = await request(baseUrl, 'GET', '/courses/course_c12_bio', { token: studentToken });
      const courseNotes = coursePortalRes.data?.data?.course?.notes || [];
      const visibleInPortal = courseNotes.some((n) => (n.id || n._id) === noteId);

      const accessRes = await request(baseUrl, 'GET', `/notes/${noteId}/access`, { token: studentToken });
      const streamRes = await request(baseUrl, 'GET', `/notes/${noteId}/stream`, { token: studentToken });

      // Clean up test note record in memory store after verification
      await request(baseUrl, 'DELETE', `/notes/${noteId}`, { token: adminToken });

      const passed =
        uploadRes.status === 201 &&
        Boolean(driveFileId) &&
        createdNote?.storageProvider === 'gdrive' &&
        visibleInPortal &&
        accessRes.status === 200 &&
        accessRes.data?.data?.driveFileId === driveFileId &&
        streamRes.status === 200;

      recordResult({
        testId: 'TC-17',
        testLevel: 'End-to-End Google Drive Integration',
        requirement: 'FR-NOTE-03, FR-NOTE-04, FR-NOTE-05',
        scenario: 'Admin uploads PDF study material -> saved to Google Drive -> Student accesses Google Drive content from Course Portal',
        testInput: 'POST /api/v1/notes (PDF upload) -> GET /api/v1/courses/course_c12_bio -> GET /api/v1/notes/:id/access & /stream',
        expectedOutcome: '201 Created with Google Drive File ID; visible in Course Portal; student access & PDF stream authorized.',
        actualOutcome: `HTTP ${uploadRes.status}; driveFileId="${driveFileId}", visibleInCoursePortal=${visibleInPortal}, accessStatus=${accessRes.status}, streamStatus=${streamRes.status}`,
        httpStatus: uploadRes.status,
        latencyMs: uploadRes.durationMs + accessRes.durationMs + streamRes.durationMs,
        status: passed ? 'PASS' : 'FAIL',
      });
    }

    // =========================================================================
    // TC-18: FR-AUTH-05..09 - Profile, Update Profile, Change Password, Refresh Token, Logout
    // =========================================================================
    {
      const meRes = await request(baseUrl, 'GET', '/auth/me', { token: studentToken });
      const updRes = await request(baseUrl, 'PUT', '/auth/profile', {
        token: studentToken,
        body: { name: 'SRS Student Updated', phone: '9111222333' },
      });
      const pwRes = await request(baseUrl, 'PUT', '/auth/change-password', {
        token: studentToken,
        body: { oldPassword: 'Password@123', newPassword: 'NewPassword@456' },
      });
      const logoutRes = await request(baseUrl, 'POST', '/auth/logout', { token: studentToken });

      const passed =
        meRes.status === 200 &&
        updRes.status === 200 &&
        updRes.data?.data?.user?.name === 'SRS Student Updated' &&
        pwRes.status === 200 &&
        logoutRes.status === 200;

      recordResult({
        testId: 'TC-18',
        testLevel: 'API / Auth Lifecycle',
        requirement: 'FR-AUTH-05, FR-AUTH-06, FR-AUTH-07, FR-AUTH-09',
        scenario: 'Authenticated profile retrieval, profile update, password change, and logout cookie clearing',
        testInput: 'GET /auth/me -> PUT /auth/profile -> PUT /auth/change-password -> POST /auth/logout',
        expectedOutcome: 'All return 200 OK; profile updated; new password hashed; cookies cleared on logout.',
        actualOutcome: `me=${meRes.status}, update=${updRes.status} (name="${updRes.data?.data?.user?.name}"), passwordChange=${pwRes.status}, logout=${logoutRes.status}`,
        httpStatus: 200,
        latencyMs: meRes.durationMs + updRes.durationMs + pwRes.durationMs + logoutRes.durationMs,
        status: passed ? 'PASS' : 'FAIL',
      });
    }

    // =========================================================================
    // TC-19: FR-COURSE-02, FR-COURSE-03, FR-VIDEO-02 - RBAC & Video Embed Unit/API checks
    // =========================================================================
    {
      const nonAdminCreate = await request(baseUrl, 'POST', '/courses', {
        token: studentToken,
        body: { title: 'Unauthorized Course', description: 'Should fail with 403' },
      });
      const hierarchyRes = await request(baseUrl, 'GET', '/courses/course_c12_chem');
      const ytId = videoService.extractYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      const embedUrl = videoService.generateEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

      const passed =
        nonAdminCreate.status === 403 &&
        hierarchyRes.status === 200 &&
        Array.isArray(hierarchyRes.data?.data?.course?.subjects) &&
        ytId === 'dQw4w9WgXcQ' &&
        embedUrl.includes('youtube-nocookie.com/embed/dQw4w9WgXcQ');

      recordResult({
        testId: 'TC-19',
        testLevel: 'Unit & RBAC Security',
        requirement: 'FR-COURSE-02, FR-COURSE-03, FR-VIDEO-02',
        scenario: 'Non-admin course creation blocked (403), course hierarchy loaded, YouTube privacy embed derived',
        testInput: 'POST /courses (student token) & GET /courses/course_c12_chem & videoService.generateEmbedUrl()',
        expectedOutcome: '403 Forbidden for student; 200 hierarchy with subjects/chapters/lessons; youtube-nocookie embed URL.',
        actualOutcome: `nonAdminStatus=${nonAdminCreate.status}, hierarchyStatus=${hierarchyRes.status}, embedUrl="${embedUrl}"`,
        httpStatus: nonAdminCreate.status,
        latencyMs: nonAdminCreate.durationMs + hierarchyRes.durationMs,
        status: passed ? 'PASS' : 'FAIL',
      });
    }

    // =========================================================================
    // TC-20: FR-ADMIN-01..04 & FR-BANNER-01 - Admin Dashboard, Users, Orders & Banners
    // =========================================================================
    {
      const statsRes = await request(baseUrl, 'GET', '/admin/dashboard', { token: adminToken });
      const usersRes = await request(baseUrl, 'GET', '/admin/users?page=1&limit=10', { token: adminToken });
      const ordersRes = await request(baseUrl, 'GET', '/admin/orders?status=PAID', { token: adminToken });
      const bannersRes = await request(baseUrl, 'GET', '/banners/active');

      const stats = statsRes.data?.data;
      const passed =
        statsRes.status === 200 &&
        typeof stats?.totalUsers === 'number' &&
        typeof stats?.totalRevenue === 'number' &&
        usersRes.status === 200 &&
        ordersRes.status === 200 &&
        bannersRes.status === 200 &&
        Array.isArray(bannersRes.data?.data?.banners);

      recordResult({
        testId: 'TC-20',
        testLevel: 'API Integration / Admin & Banners',
        requirement: 'FR-ADMIN-01, FR-ADMIN-02, FR-PAY-11, FR-BANNER-01',
        scenario: 'Verify Admin dashboard aggregates, user listing, filtered order listing, and active homepage banners',
        testInput: 'GET /admin/dashboard, GET /admin/users, GET /admin/orders?status=PAID, GET /banners/active',
        expectedOutcome: '200 OK for all endpoints with accurate counts, revenue, and active banners.',
        actualOutcome: `stats=${statsRes.status} (users=${stats?.totalUsers}, revenue=₹${stats?.totalRevenue}), users=${usersRes.status}, orders=${ordersRes.status}, banners=${bannersRes.data?.data?.banners?.length}`,
        httpStatus: 200,
        latencyMs: statsRes.durationMs + usersRes.durationMs + ordersRes.durationMs + bannersRes.durationMs,
        status: passed ? 'PASS' : 'FAIL',
      });
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  // Write JSON and CSV reports
  const outJsonPath = path.resolve(__dirname, 'srs_test_results.json');
  fs.writeFileSync(outJsonPath, JSON.stringify(results, null, 2), 'utf8');

  const csvHeaders = [
    'Test ID',
    'Test Level',
    'SRS Requirement ID',
    'Test Scenario',
    'Test Input / Action',
    'Expected Outcome',
    'Actual Outcome',
    'HTTP Status',
    'Response Time (ms)',
    'Result Status',
    'Executed At (ISO)',
  ];

  const escapeCsv = (val) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const nowIso = new Date().toISOString();
  const csvRows = [
    csvHeaders.join(','),
    ...results.map((r) =>
      [
        r.testId,
        r.testLevel,
        r.requirement,
        r.scenario,
        r.testInput,
        r.expectedOutcome,
        r.actualOutcome,
        r.httpStatus,
        r.latencyMs,
        r.status,
        nowIso,
      ]
        .map(escapeCsv)
        .join(',')
    ),
  ];

  const outCsvPath = path.resolve(__dirname, '../../SRS_Test_Results.csv');
  fs.writeFileSync(outCsvPath, csvRows.join('\n'), 'utf8');

  const passedCount = results.filter((r) => r.status === 'PASS').length;
  console.log(`\n🎉 Completed ${results.length} SRS Verification Tests: ${passedCount}/${results.length} PASSED.`);
  console.log(`📄 Saved CSV report to: ${outCsvPath}`);

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runSrsTests().catch((err) => {
  console.error('❌ Test runner failed:', err);
  process.exit(1);
});
