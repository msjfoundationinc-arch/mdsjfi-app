/**
 * Automated Test Suite for Webcam Facial Recognition & Attendance Engine
 * Montessori de San Jose Foundation Inc.
 */

(function(global) {
    'use strict';

    // Mock localStorage if running outside of browser
    if (typeof localStorage === 'undefined') {
        const mockStore = {};
        global.localStorage = {
            getItem: (k) => (k in mockStore ? mockStore[k] : null),
            setItem: (k, v) => { mockStore[k] = String(v); },
            removeItem: (k) => { delete mockStore[k]; },
            clear: () => { for (const k in mockStore) delete mockStore[k]; }
        };
    }

    const FaceEngine = (typeof module !== 'undefined' && module.exports)
        ? require('./face-recognition.js')
        : global.MDSJ_FaceEngine;

    const TestResults = {
        total: 0,
        passed: 0,
        failed: 0,
        suites: []
    };

    function describe(suiteName, fn) {
        const suite = { name: suiteName, tests: [] };
        TestResults.suites.push(suite);

        function test(testName, testFn) {
            TestResults.total++;
            const t = { name: testName, passed: false, error: null };
            try {
                testFn();
                t.passed = true;
                TestResults.passed++;
            } catch (err) {
                t.passed = false;
                t.error = err.message || String(err);
                TestResults.failed++;
            }
            suite.tests.push(t);
        }

        fn(test);
    }

    function assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    function assertEquals(actual, expected, message) {
        if (actual !== expected) {
            throw new Error((message ? message + ' ' : '') + `Expected [${expected}] but got [${actual}]`);
        }
    }

    // ======================== EXECUTE TEST SUITES ========================
    function runAllTests() {
        TestResults.total = 0;
        TestResults.passed = 0;
        TestResults.failed = 0;
        TestResults.suites = [];

        // Reset storage before tests
        localStorage.removeItem('mdsj_face_enrollments');
        localStorage.removeItem('mdsj_face_attendance_logs');
        localStorage.removeItem('mdsj_face_confidence_threshold');

        // 1. Enrollment Tests
        describe('1. Biometric Enrollment', (it) => {
            it('should enroll a Student face and link to database record', () => {
                const student = {
                    id: 'STU-2026-07001',
                    role: 'Student',
                    name: 'Jaurigue, Zhanru Jaren',
                    identifier: '110253190313',
                    details: 'Grade 7 - Jade'
                };
                const embedding = FaceEngine.generateSyntheticEmbedding('student-zhanru');
                const enrolled = FaceEngine.enrollPerson(student, embedding);

                assert(enrolled && enrolled.id, 'Enrollment record must have an ID');
                assertEquals(enrolled.personId, 'STU-2026-07001');
                assertEquals(enrolled.role, 'Student');
                assertEquals(enrolled.identifier, '110253190313');
                assertEquals(enrolled.embedding.length, FaceEngine.EMBEDDING_DIM);

                const retrieved = FaceEngine.findEnrollmentByPersonId('STU-2026-07001');
                assert(retrieved !== null, 'Should find enrolled student by ID');
            });

            it('should enroll a Teacher face and link to payroll/teacher record', () => {
                const teacher = {
                    id: 'emp-t001',
                    role: 'Teacher',
                    name: 'ROSABELYN R. ESTEBAN',
                    identifier: 'T001',
                    details: 'AP Teacher'
                };
                const embedding = FaceEngine.generateSyntheticEmbedding('teacher-rosabelyn');
                const enrolled = FaceEngine.enrollPerson(teacher, embedding);

                assertEquals(enrolled.personId, 'emp-t001');
                assertEquals(enrolled.role, 'Teacher');
                assertEquals(enrolled.identifier, 'T001');
            });

            it('should enroll a Faculty member face (School Principal)', () => {
                const faculty = {
                    id: 'emp-t008',
                    role: 'Faculty',
                    name: 'GANITO P. CANSUNCAD',
                    identifier: 'T008',
                    details: 'School Principal'
                };
                const embedding = FaceEngine.generateSyntheticEmbedding('principal-cansuncad');
                const enrolled = FaceEngine.enrollPerson(faculty, embedding);

                assertEquals(enrolled.personId, 'emp-t008');
                assertEquals(enrolled.role, 'Faculty');
            });

            it('should allow re-enrollment (updating biometric embedding) for the same person', () => {
                const student = {
                    id: 'STU-2026-07001',
                    role: 'Student',
                    name: 'Jaurigue, Zhanru Jaren',
                    identifier: '110253190313',
                    details: 'Grade 7 - Jade'
                };
                const newEmbedding = FaceEngine.generateSyntheticEmbedding('student-zhanru-new-angle');
                const reEnrolled = FaceEngine.enrollPerson(student, newEmbedding);

                assert(reEnrolled !== null, 'Re-enrollment should succeed');
                const all = FaceEngine.getEnrollments().filter(e => e.personId === 'STU-2026-07001');
                assertEquals(all.length, 1, 'Re-enrollment must update existing record rather than create duplicate');
            });

            it('should allow removing a person face data completely', () => {
                const removed = FaceEngine.removeEnrollment('STU-2026-07001');
                assert(removed === true, 'Removal should return true');
                const lookup = FaceEngine.findEnrollmentByPersonId('STU-2026-07001');
                assert(lookup === null, 'Removed record should not be found in storage');

                // Re-enroll student for subsequent recognition tests
                const student = {
                    id: 'STU-2026-07001',
                    role: 'Student',
                    name: 'Jaurigue, Zhanru Jaren',
                    identifier: '110253190313',
                    details: 'Grade 7 - Jade'
                };
                FaceEngine.enrollPerson(student, FaceEngine.generateSyntheticEmbedding('student-zhanru'));
            });
        });

        // 2. Recognition & Confidence Threshold Tests
        describe('2. Facial Recognition & Verification', (it) => {
            it('should successfully match an enrolled face above confidence threshold', () => {
                const embedding = FaceEngine.generateSyntheticEmbedding('student-zhanru');
                const res = FaceEngine.matchFace(embedding, 0.75);

                assert(res.matched === true, 'Matching identical embedding must succeed');
                assertEquals(res.person.personId, 'STU-2026-07001');
                assert(res.confidence >= 95, `Confidence must be high (got ${res.confidence}%)`);
            });

            it('should reject an unrecognized face that is not enrolled', () => {
                const unknownEmbedding = FaceEngine.generateSyntheticEmbedding('completely-unknown-intruder');
                const res = FaceEngine.matchFace(unknownEmbedding, 0.75);

                assert(res.matched === false, 'Unknown face must not match enrolled profiles');
                assertEquals(res.reason, 'BELOW_THRESHOLD');
                assert(res.message.includes('below the required threshold') || res.message.includes('unrecognized'), 'Message should indicate unrecognized face');
            });

            it('should correctly respect adjusted confidence thresholds', () => {
                const teacherEmbed = FaceEngine.generateSyntheticEmbedding('teacher-rosabelyn');
                
                // Very strict threshold (99%)
                const resStrict = FaceEngine.matchFace(teacherEmbed, 0.99);
                assert(resStrict.matched === true, 'Identical face should match even at 99% threshold');

                // Setting custom threshold in config
                FaceEngine.setConfidenceThreshold(0.85);
                assertEquals(FaceEngine.getConfidenceThreshold(), 0.85);
                FaceEngine.setConfidenceThreshold(0.75); // Reset back to default
            });
        });

        // 3. Log In / Log Out State Logic Tests
        describe('3. Attendance State Transitions (Log In / Log Out)', (it) => {
            const student = {
                id: 'STU-2026-07001',
                role: 'Student',
                name: 'Jaurigue, Zhanru Jaren',
                identifier: '110253190313',
                details: 'Grade 7 - Jade'
            };

            it('should report LOGGED_OUT initial state for a person with no previous logs today', () => {
                FaceEngine.clearAllAttendanceLogs();
                const status = FaceEngine.getPersonCurrentStatus(student.id);
                assertEquals(status, 'LOGGED_OUT');
                assertEquals(FaceEngine.determineNextAction(student.id), 'LOG_IN');
            });

            it('should record an initial LOG_IN for a logged-out person', () => {
                const log = FaceEngine.recordFacialAttendance(student, 'LOG_IN', 0.95);
                assertEquals(log.action, 'LOG_IN');
                assertEquals(log.personId, student.id);
                assertEquals(FaceEngine.getPersonCurrentStatus(student.id), 'LOGGED_IN');
                assertEquals(FaceEngine.determineNextAction(student.id), 'LOG_OUT');
            });

            it('should prevent a duplicate LOG_IN when the person is already LOGGED_IN', () => {
                let threw = false;
                try {
                    FaceEngine.recordFacialAttendance(student, 'LOG_IN', 0.95);
                } catch (err) {
                    threw = true;
                    assertEquals(err.code, 'DUPLICATE_LOGIN');
                }
                assert(threw, 'Must throw error when attempting duplicate log-in');
            });

            it('should record a valid LOG_OUT for a person who is currently LOGGED_IN', () => {
                const log = FaceEngine.recordFacialAttendance(student, 'LOG_OUT', 0.94);
                assertEquals(log.action, 'LOG_OUT');
                assertEquals(FaceEngine.getPersonCurrentStatus(student.id), 'LOGGED_OUT');
                assertEquals(FaceEngine.determineNextAction(student.id), 'LOG_IN');
            });

            it('should reject an out-of-order LOG_OUT when person is currently LOGGED_OUT', () => {
                let threw = false;
                try {
                    FaceEngine.recordFacialAttendance(student, 'LOG_OUT', 0.94);
                } catch (err) {
                    threw = true;
                    assertEquals(err.code, 'OUT_OF_ORDER_LOGOUT');
                }
                assert(threw, 'Must throw error when attempting out-of-order log-out');
            });

            it('should automatically determine the correct transition in AUTO mode', () => {
                // Currently LOGGED_OUT -> AUTO should LOG_IN
                const log1 = FaceEngine.recordFacialAttendance(student, 'AUTO', 0.96);
                assertEquals(log1.action, 'LOG_IN');
                assertEquals(FaceEngine.getPersonCurrentStatus(student.id), 'LOGGED_IN');

                // Now LOGGED_IN -> AUTO should LOG_OUT
                const log2 = FaceEngine.recordFacialAttendance(student, 'AUTO', 0.96);
                assertEquals(log2.action, 'LOG_OUT');
                assertEquals(FaceEngine.getPersonCurrentStatus(student.id), 'LOGGED_OUT');
            });
        });

        // 4. Role Handling & Filtering Tests
        describe('4. Role Awareness & Filtering (Students, Teachers, Faculty)', (it) => {
            const student = { id: 'STU-2026-07001', role: 'Student', name: 'Jaurigue, Zhanru Jaren', identifier: '110253190313' };
            const teacher = { id: 'emp-t001', role: 'Teacher', name: 'ROSABELYN R. ESTEBAN', identifier: 'T001' };
            const faculty = { id: 'emp-t008', role: 'Faculty', name: 'GANITO P. CANSUNCAD', identifier: 'T008' };

            it('should record attendance events with accurate role tags', () => {
                FaceEngine.clearAllAttendanceLogs();
                const logS = FaceEngine.recordFacialAttendance(student, 'LOG_IN', 0.95);
                const logT = FaceEngine.recordFacialAttendance(teacher, 'LOG_IN', 0.96);
                const logF = FaceEngine.recordFacialAttendance(faculty, 'LOG_IN', 0.97);

                assertEquals(logS.role, 'Student');
                assertEquals(logT.role, 'Teacher');
                assertEquals(logF.role, 'Faculty');
            });

            it('should allow filtering attendance logs strictly by role', () => {
                const allLogs = FaceEngine.getAttendanceLogs();
                const studentLogs = allLogs.filter(l => l.role === 'Student');
                const teacherLogs = allLogs.filter(l => l.role === 'Teacher');
                const facultyLogs = allLogs.filter(l => l.role === 'Faculty');

                assertEquals(studentLogs.length, 1);
                assertEquals(teacherLogs.length, 1);
                assertEquals(facultyLogs.length, 1);
            });
        });

        // 5. Error Handling Tests
        describe('5. Error Handling & Edge Cases', (it) => {
            it('should reject enrolling a face that is already enrolled to a different person', () => {
                const existingPerson = { id: 'STU-2026-07001', role: 'Student', name: 'Jaurigue, Zhanru Jaren', identifier: '110253190313' };
                const imposterPerson = { id: 'STU-2026-07002', role: 'Student', name: 'Imposter Student', identifier: '110253190999' };

                // Get identical embedding as existingPerson
                const duplicateEmbedding = FaceEngine.generateSyntheticEmbedding('student-zhanru');

                let threw = false;
                try {
                    FaceEngine.enrollPerson(imposterPerson, duplicateEmbedding);
                } catch (err) {
                    threw = true;
                    assertEquals(err.code, 'FACE_ALREADY_ENROLLED');
                    assert(err.message.includes('Face already enrolled'), 'Error message must alert user of duplicate enrollment');
                }
                assert(threw, 'Should block registering an already-enrolled face under another account');
            });

            it('should handle camera permission denied gracefully with clear message', async () => {
                // Mock navigator.mediaDevices.getUserMedia throwing NotAllowedError
                const origMediaDevices = global.navigator && global.navigator.mediaDevices;
                if (!global.navigator) global.navigator = {};
                global.navigator.mediaDevices = {
                    getUserMedia: async () => {
                        const err = new Error('Permission denied');
                        err.name = 'NotAllowedError';
                        throw err;
                    }
                };

                let threw = false;
                try {
                    await FaceEngine.startWebcam(null);
                } catch (err) {
                    threw = true;
                    assertEquals(err.code, 'PERMISSION_DENIED');
                    assert(err.message.includes('Camera permission was denied'), 'Should provide friendly permission error');
                }
                assert(threw, 'Should catch permission denied error');

                // Restore original media devices
                if (origMediaDevices) global.navigator.mediaDevices = origMediaDevices;
                else delete global.navigator.mediaDevices;
            });

            it('should handle camera not found error gracefully', async () => {
                if (!global.navigator) global.navigator = {};
                global.navigator.mediaDevices = {
                    getUserMedia: async () => {
                        const err = new Error('Device not found');
                        err.name = 'NotFoundError';
                        throw err;
                    }
                };

                let threw = false;
                try {
                    await FaceEngine.startWebcam(null);
                } catch (err) {
                    threw = true;
                    assertEquals(err.code, 'NO_CAMERA');
                    assert(err.message.includes('No webcam or camera device was found'), 'Should provide friendly no-camera error');
                }
                assert(threw, 'Should catch no camera error');
            });

            it('should detect when no face is in frame', () => {
                // Create a blank/black canvas (no skin tone or face contours)
                if (typeof document !== 'undefined') {
                    const canvas = document.createElement('canvas');
                    canvas.width = 160;
                    canvas.height = 120;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, 160, 120);

                    let threw = false;
                    try {
                        FaceEngine.extractEmbeddingFromCanvas(canvas);
                    } catch (err) {
                        threw = true;
                        assertEquals(err.code, 'NO_FACE');
                        assert(err.message.includes('No face detected'), 'Should alert that no face was detected');
                    }
                    assert(threw, 'Must throw NO_FACE when analyzing an empty frame');
                }
            });

            it('should detect when more than one face is in frame', () => {
                if (typeof document !== 'undefined') {
                    const canvas = document.createElement('canvas');
                    canvas.width = 320;
                    canvas.height = 240;
                    const ctx = canvas.getContext('2d');
                    ctx.fillStyle = '#101010';
                    ctx.fillRect(0, 0, 320, 240);

                    // Draw Face 1 (left side)
                    ctx.fillStyle = 'rgb(210, 160, 120)';
                    ctx.beginPath();
                    ctx.arc(80, 120, 45, 0, 2 * Math.PI);
                    ctx.fill();

                    // Draw Face 2 (right side)
                    ctx.fillStyle = 'rgb(210, 160, 120)';
                    ctx.beginPath();
                    ctx.arc(240, 120, 45, 0, 2 * Math.PI);
                    ctx.fill();

                    let threw = false;
                    try {
                        FaceEngine.extractEmbeddingFromCanvas(canvas);
                    } catch (err) {
                        threw = true;
                        assertEquals(err.code, 'MULTIPLE_FACES');
                        assert(err.message.includes('Multiple faces detected'), 'Should alert when multiple faces are in frame');
                    }
                    assert(threw, 'Must throw MULTIPLE_FACES when multiple faces are in frame');
                }
            });
        });

        return TestResults;
    }

    // Auto-run if executed directly via Node
    if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].includes('face-recognition-test.js')) {
        const results = runAllTests();
        console.log(`\n============================================================`);
        console.log(`MDSJFI Facial Recognition Automated Test Results`);
        console.log(`Total Tests: ${results.total} | Passed: ${results.passed} | Failed: ${results.failed}`);
        console.log(`============================================================\n`);
        results.suites.forEach(suite => {
            console.log(`\n[Suite] ${suite.name}`);
            suite.tests.forEach(t => {
                const icon = t.passed ? '✓ PASS' : '✗ FAIL';
                console.log(`  ${icon}: ${t.name}`);
                if (!t.passed && t.error) {
                    console.error(`     Error: ${t.error}`);
                }
            });
        });
        if (results.failed > 0) {
            process.exit(1);
        } else {
            console.log(`\n✓ All tests passed successfully!`);
        }
    }

    global.MDSJ_FaceTests = {
        runAllTests,
        getResults: () => TestResults
    };

})(typeof window !== 'undefined' ? window : globalThis);
