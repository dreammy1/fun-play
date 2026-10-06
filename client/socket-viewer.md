# Socket Presence Viewer (Bangla)

Ei document ta diye onno website (buyer/viewer) shohoje Socket.IO diye user-er device online/offline status dekhabe.

## Overview
- Viewer socket-e `apiKey` pathabe.
- Server oi `apiKey` diye user identify korbe.
- Server oi user-er shob device er current status snapshot pathabe, tarpor live update push korbe.

## Server Events
- Client → Server: `viewer:registerApiKey`
  - Payload: `{ apiKey: string }`
  - Kaj: API key validate kore user determine kora, room join, initial snapshot pathano.
- Server → Client: `viewer:devices`
  - Initial snapshot: array of devices with live status.
- Server → Client: `viewer:device`
  - Incremental single-device update (online/offline + lastSeen).
- Server → Client: `viewer:error`
  - Jodi apiKey invalid/expired/inactive thake.

## Device Object
```json
{
  "deviceId": "ANDROID_ID_OR_DEVICE_CODE",
  "deviceName": "Xiaomi Redmi Note 11",
  "deviceUserName": "Abir Redmi",
  "active": true,
  "lastSeen": "2025-11-17T14:42:31.123Z"
}
```

## Minimal Frontend Example (Vanilla JS)
```html
<script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
<script>
  // Replace with your server origin
  const socket = io("https://test-api.oraclepay.org", { transports: ["websocket"] });

  socket.on("connect", () => {
    // Send API key once connected
    socket.emit("viewer:registerApiKey", { apiKey: "sk_sub_xxx..." });
  });

  // Initial full list
  socket.on("viewer:devices", (list) => {
    console.log("initial devices", list);
    render(list);
  });

  // Incremental updates
  socket.on("viewer:device", (d) => {
    console.log("update", d);
    updateOne(d);
  });

  socket.on("viewer:error", (e) => {
    console.error("viewer error", e);
  });

  function render(list) {
    // TODO: render the full list into your UI
  }

  function updateOne(d) {
    // TODO: update single device card by d.deviceId
  }
</script>
```

## React Example (Quick)
```js
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function DevicePresence({ apiKey }) {
  const [devices, setDevices] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io("https://test-api.oraclepay.org", { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("viewer:registerApiKey", { apiKey });
    });

    socket.on("viewer:devices", (list) => setDevices(list));

    socket.on("viewer:device", (d) => {
      setDevices((prev) => {
        const idx = prev.findIndex((x) => x.deviceId === d.deviceId);
        if (idx === -1) return [...prev, d];
        const copy = prev.slice();
        copy[idx] = { ...copy[idx], ...d };
        return copy;
      });
    });

    socket.on("viewer:error", (e) => console.error(e));

    return () => socket.close();
  }, [apiKey]);

  return (
    <div>
      {devices.map((d) => (
        <div key={d.deviceId}>
          <strong>{d.deviceUserName || d.deviceName || d.deviceId}</strong>
          <span> — {d.active ? "Online" : "Offline"}</span>
          {d.lastSeen && <small> (last: {new Date(d.lastSeen).toLocaleString()})</small>}
        </div>
      ))}
    </div>
  );
}
```

## Notes
- `apiKey` must be valid, active (`apiKeyActive`), and subscription must be active (`active: true`, `endDate` in future).
- Server caches device owner & name to reduce DB hits; updates are pushed in realtime.
- Presence depends on device app socket heartbeats; if app closes, status will auto-switch to offline after ~30s.

## Troubleshooting
- `viewer:error: Invalid apiKey` → API key thik moto pathano hocche kina check korun.
- `viewer:error: Subscription inactive or expired` → User-er subscription end date cross kore geche.
- Kono device dekhache na → User-er `Device` collection e entry ache kina, `deviceCode` match hocche kina, app online kina check korun.
