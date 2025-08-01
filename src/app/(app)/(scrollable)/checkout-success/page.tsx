"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import sample from "lodash/sample";

const celebrationGifs = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaHJ4c2pyb3ZlZ2J5OXM5bHZ4ZHFhNHVqZ2Q3Y25tMG9yY3ZkaTR4NSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o6fJ1BM7R2EBRDnxK/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHR1enZ6dmt6azJ0enN1bzVzZHRnOW95dnN5am9tM2ZpcHNhZWhvcyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/artj92V8o75VPL7AeQ/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbzRhNmdrbHNycHFhYmRzY3Zic3plbWF4cWN4a253NXg2YTRsdmJmbCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/SRO0ZwmImic0/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdm5xZnR4d3RpaXk3NmM3bGJucDVqM25yZ3FjM2M3aDhlYm4zNnc2ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/5VKbvrjxpVJCM/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbHprYWRtbW91dmJ0Ym9kOHl1eXh1cXQzM2lrc2xocnQxZTRuYzZyeSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3oEjI5VtIhHvK37WYo/giphy.gif",
];

export default function CheckoutSuccessPage() {
  const [gifUrl, setGifUrl] = useState<string | undefined>();

  useEffect(() => {
    setGifUrl(sample(celebrationGifs));

    // Trigger confetti effect
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      scalar: 1.2, // slightly bigger confetti
      ticks: 200, // runs for a bit longer
    });

    // Add some extra bursts
    const interval = setInterval(() => {
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.8 },
      });
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.8 },
      });
    }, 400);

    // Clear interval after a few seconds
    setTimeout(() => {
      clearInterval(interval);
    }, 2000);
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <h1 className="mb-4 text-4xl font-bold">Checkout Successful!</h1>
      <p className="mb-8 text-lg">Thank you for your purchase!</p>
      {gifUrl && (
        <img
          src={gifUrl}
          alt="Celebration GIF"
          className="max-w-sm rounded-lg shadow-lg"
        />
      )}
    </div>
  );
}
