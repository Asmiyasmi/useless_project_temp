const http = require("http");
const WebSocket = require("ws");
const queueManager = require("../server/queueManager");

console.log("=== WAITLESS AUTOMATED SYSTEM TESTS ===");

// 1. Test QueueManager Session Creation
console.log("\n[Test 1] Session Creation & Constraints");
const s1 = queueManager.createSession("Alice");
console.log(`- Created session: ${s1.sessionId}`);
console.log(`- Waiter name: ${s1.name}`);
console.log(`- Actual wait duration: ${s1.actualWaitDuration}s (Must be between 1 and 120s)`);
if (s1.actualWaitDuration < 1 || s1.actualWaitDuration > 120) {
  console.error("FAIL: Wait duration out of bounds!");
  process.exit(1);
}
console.log(`- Assigned personality: ${s1.personality}`);
const validPersonalities = ["The Patient One", "The Impatient", "The Confused", "The Optimist", "The Professional Waiter"];
if (!validPersonalities.includes(s1.personality)) {
  console.error("FAIL: Invalid personality!");
  process.exit(1);
}
console.log("PASS: Session creation meets all PRD constraints.");

// 2. Test Multi-User Queue
console.log("\n[Test 2] Multiplayer Active Queue");
const s2 = queueManager.createSession("Bob");
const s3 = queueManager.createSession("Charlie");
console.log(`- Active queue length: ${queueManager.activeQueue.length}`);
if (queueManager.activeQueue.length < 3) {
  console.error("FAIL: Queue length mismatch!");
  process.exit(1);
}
console.log("PASS: Multiple users correctly tracked in active queue.");

// 3. Test Exit Waiting & Former Waiters
console.log("\n[Test 3] Exit Waiting & Former Waiter Recording");
const exitResult = queueManager.exitQueue(s2.sessionId);
console.log(`- Exited user: ${exitResult.name}`);
console.log(`- Waited seconds: ${exitResult.waitedSeconds}`);
console.log(`- Last position: ${exitResult.lastPosition}`);
const formerList = queueManager.getFormerWaiters();
const foundInFormer = formerList.some(fw => fw.name === "Bob");
if (!foundInFormer) {
  console.error("FAIL: Exited user not found in Former Waiters list!");
  process.exit(1);
}
console.log("PASS: Former waiter registered and archived.");

// 4. Test "Why Am I Waiting?"
console.log("\n[Test 4] Satirical Explanations");
const whyAnswer = queueManager.getRandomWhyAnswer();
console.log(`- Random reason: "${whyAnswer}"`);
if (!whyAnswer || typeof whyAnswer !== "string") {
  console.error("FAIL: Empty why answer!");
  process.exit(1);
}
console.log("PASS: 'Why am I waiting?' logic functional.");

// 5. Test Authoritative Completion
console.log("\n[Test 5] Completion Flow & 0% Purpose Accomplished");
// Manually expire duration to test completion handler
s3.joinedAt = Date.now() - (s3.actualWaitDuration * 1000 + 1000);
queueManager.completeSession(s3.sessionId);
const completedSession = queueManager.getSession(s3.sessionId);
console.log(`- Final status: ${completedSession.status}`);
console.log(`- Final position: #${completedSession.finalReport.finalPosition}`);
console.log(`- Purpose Accomplished: ${completedSession.finalReport.purposeAccomplished}`);
if (completedSession.finalReport.purposeAccomplished !== "0%") {
  console.error("FAIL: Purpose accomplished is not strictly 0%!");
  process.exit(1);
}
if (completedSession.finalReport.finalPosition !== 1) {
  console.error("FAIL: Final position is not #1!");
  process.exit(1);
}
console.log(`- Certificate ID: ${completedSession.certificate.certificateId}`);
console.log("PASS: Completion flow strictly adheres to 0% purpose accomplished and #1 position.");

console.log("\n>>> ALL 5 AUTOMATED TESTS PASSED SUCCESSFULLY! <<<");
process.exit(0);
