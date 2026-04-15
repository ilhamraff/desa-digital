"use client";

import { useEffect, useState } from "react";

export function Greeting({ userName }: { userName: string }) {
  // Default string to prevent severe layout shift before hydration
  const [greeting, setGreeting] = useState("Halo");

  useEffect(() => {
    // Get client's current hour
    const hour = new Date().getHours();

    // Logika perhitungan waktu berdasarkan requirement:
    if (hour >= 5 && hour < 12) {
      // Pukul 05:00–11:59
      setGreeting("Selamat Pagi");
    } else if (hour >= 12 && hour < 15) {
      // Pukul 12:00–14:59
      setGreeting("Selamat Siang");
    } else if (hour >= 15 && hour < 18) {
      // Pukul 15:00–17:59
      setGreeting("Selamat Sore");
    } else {
      // Pukul 18:00–04:59
      setGreeting("Selamat Malam");
    }
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">
        {greeting}, {userName}! 👋
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        Berikut ringkasan data Desa hari ini.
      </p>
    </div>
  );
}
