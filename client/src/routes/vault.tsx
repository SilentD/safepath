import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { safetyAPI } from "@/services/emergency";

export const Route = createFileRoute("/vault")({
  head: () => ({
    meta: [
      { title: "Red Mode Vault — One2Many" },
      { name: "description", content: "One-press emergency alert with silent audio recording and an encrypted evidence vault." },
      { property: "og:title", content: "Red Mode Vault — One2Many" },
      { property: "og:description", content: "Instant alerts and encrypted evidence storage." },
    ],
  }),
  component: Vault,
});

const items = [
  { t: "Audio · 2m 14s", d: "12 Oct, 22:41", tag: "Auto" },
  { t: "Photo · 3 files", d: "09 Oct, 18:05", tag: "Manual" },
  { t: "Location trail", d: "09 Oct, 17:50", tag: "Auto" },
];

function Vault() {
  const [on, setOn] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // MediaRecorder refs for background audio capture
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Function to start discrete audio recording
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Create blob once recording stops
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        // Get current location snapshot for evidence tagging
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              handleCompleteRecording(audioBlob, coords);
            },
            () => {
              handleCompleteRecording(audioBlob, null);
            }
          );
        } else {
          handleCompleteRecording(audioBlob, null);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      console.log("Discrete audio recording started...");
    } catch (err) {
      console.error("Microphone access denied or unavailable:", err);
    }
  };

  // Function to stop audio recording and trigger upload
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      console.log("Audio recording stopped. Processing evidence...");
    }
  };

  const handleToggleRedMode = async () => {
    const nextState = !on;
    setLoading(true);

    try {
      if (nextState) {
        // 1. Send backend notification to lock session state in Red Mode
        await safetyAPI.triggerRedMode();

        // 2. Obtain current GPS coordinates and dispatch immediate SOS
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const gpsLocation = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
              await safetyAPI.triggerSOS({ gpsLocation, note: "Red Mode Panic button triggered." });
            }
          );
        } else {
          await safetyAPI.triggerSOS({ note: "Red Mode Panic button triggered." });
        }

        // 3. Start discrete recording stream
        await startRecording();
      } else {
        // Stop recording when Red Mode is turned off
        stopRecording();
      }

      setOn(nextState);
    } catch (err: any) {
      alert(err.message || "Failed to sync Red Mode state with backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRecording = async (recordedBlob: Blob, currentCoords: { lat: number; lng: number } | null) => {
    try {
      console.log("Uploading discrete Red Mode evidence to vault...");
      const result = await safetyAPI.uploadEvidence(recordedBlob, currentCoords);
      console.log("Evidence stored successfully:", result);
    } catch (error) {
      console.error("Failed to upload evidence to vault:", error);
    }
  };
  
  return (
    <AppShell eyebrow="Emergency" title={on ? "Red Mode active" : "Red Mode"} red={on}>
      {/* Big Hold / Stop Button */}
      <button
        onClick={handleToggleRedMode}
        disabled={loading}
        aria-pressed={on}
        className={`mx-auto mt-4 grid aspect-square w-56 place-items-center rounded-full bg-danger text-danger-foreground glow-danger transition-transform active:scale-95 disabled:opacity-50 ${
          on ? "animate-pulse" : ""
        }`}
      >
        <span className="text-center">
          <span className="block font-display text-3xl font-bold">
            {loading ? "..." : on ? "STOP" : "HOLD"}
          </span>
          <span className="text-sm opacity-80">
            {on ? "Tap to end & verify" : "Tap to trigger"}
          </span>
        </span>
      </button>

      {/* Dynamic Status Badges */}
      <div className="mt-8 grid grid-cols-2 gap-2 text-center text-xs">
        {[
          ["Alert sent", on],
          ["Recording", on],
        ].map(([l, a]) => (
          <div
            key={l as string}
            className={`rounded-xl border p-3 transition-colors ${
              a ? "border-danger text-foreground font-semibold" : "bg-card text-muted-foreground"
            }`}
          >
            <span
              className={`mx-auto mb-1 block size-2 rounded-full ${
                a ? "bg-danger animate-ping" : "bg-muted"
              }`}
            />
            {l as string}
          </div>
        ))}
      </div>

      {/* Encrypted Evidence Section */}
      <h2 className="mt-10 text-lg font-semibold">Evidence vault</h2>
      <p className="text-sm text-muted-foreground">Encrypted. Hidden from your gallery.</p>
      <ul className="mt-4 divide-y rounded-2xl border bg-card">
        {items.map((i) => (
          <li key={i.t} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{i.t}</p>
              <p className="text-xs text-muted-foreground">{i.d}</p>
            </div>
            <span className="rounded-full bg-secondary px-2 py-1 text-xs text-muted-foreground">
              {i.tag}
            </span>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}