const http = require('http');
const WebSocket = require('ws');

http.get('http://localhost:3000', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const checks = [
      ['HTTP 200', res.statusCode === 200],
      ['Has screen-dashboard', d.includes('screen-dashboard')],
      ['Has activities.js', d.includes('activities.js')],
      ['Has activity-grid', d.includes('activity-grid')],
      ['Has queue-roster-list', d.includes('queue-roster-list')],
      ['Has 120s label', d.includes('120s')],
      ['Has bg-white body', d.includes('bg-white')],
      ['No old minigames script', !d.includes('src="minigames.js"')],
      ['Has activities panel', d.includes('dashboard-activities-panel')],
      ['Has BACK TO QUEUE', d.includes('BACK TO QUEUE')],
    ];
    console.log('=== STATIC CHECKS ===');
    checks.forEach(([label, pass]) => console.log((pass ? 'PASS' : 'FAIL') + ' ' + label));

    // Test 2: WebSocket + real-time roster
    const ws = new WebSocket('ws://localhost:3000');
    let gotQueueUpdate = false;
    let gotSessionCreated = false;
    let sessionDuration = null;
    ws.on('open', () => {
      ws.send(JSON.stringify({ action: 'JOIN_QUEUE', name: 'TestUser' }));
    });
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw);
      if (msg.type === 'SESSION_CREATED') {
        gotSessionCreated = true;
        sessionDuration = msg.session.actualWaitDuration;
      }
      if (msg.type === 'QUEUE_UPDATE') {
        gotQueueUpdate = true;
        console.log('=== WS CHECKS ===');
        const dur = sessionDuration;
        console.log((dur >= 1 && dur <= 120 ? 'PASS' : 'FAIL') + ' Duration 1-120s: ' + dur + 's');
        console.log((msg.activeRoster !== undefined ? 'PASS' : 'FAIL') + ' QUEUE_UPDATE has activeRoster');
        console.log((Array.isArray(msg.activeRoster) ? 'PASS' : 'FAIL') + ' activeRoster is array');
        if (msg.activeRoster.length > 0) {
          const first = msg.activeRoster[0];
          console.log((first.name ? 'PASS' : 'FAIL') + ' Roster entry has name: ' + first.name);
          console.log((first.position ? 'PASS' : 'FAIL') + ' Roster entry has position: ' + first.position);
        }
        ws.close();
      }
    });
    ws.on('close', () => {
      console.log((gotSessionCreated ? 'PASS' : 'FAIL') + ' SESSION_CREATED received');
      console.log((gotQueueUpdate ? 'PASS' : 'FAIL') + ' QUEUE_UPDATE received');
      console.log('=== DONE ===');
    });
  });
});
