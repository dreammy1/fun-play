import React from "react";

export default function JustDemoPage() {
  const url =
    "https://livecasinoapi.turnkeyxgaming.com/game?url=https://casinogameurl.turnkeyxgaming.com/casino/c72aa825c92c5f5fad532b117151c41d765328138f2912f9ab0998f9eafeb2c7e5d4493471bc281cadefcc9925b9e62ab2b7f19eea6c0015868dc8853e53db2b9de2281b76607089deb8776d1f10eea9";

  return (
    <div>
      <iframe src={url} width="100%" height="100vh" />
    </div>
  );
}
