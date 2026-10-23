"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MeetPreJoinLobby from "@/modules/portal/components/MeetPreJoinLobby";
import GoogleMeetRoom from "@/modules/portal/components/GoogleMeetRoom";
import {
  formatRoomCode,
  getRoomExpiryState,
  markRoomConcluded,
  clearRoomConcluded,
} from "@/modules/portal/utils/roomCodeHelper";
import { Check, ArrowRight, RefreshCw, Home, Compass, Clock } from "lucide-react";

export default function MeetClientController({ roomCode }) {
  const router = useRouter();
  const normalizedCode = formatRoomCode(roomCode);

  // Initial user resolution
  const [initialUser, setInitialUser] = useState(null);
  const [joinedParticipant, setJoinedParticipant] = useState(null);
  const [callEnded, setCallEnded] = useState(false);
  const [expiryState, setExpiryState] = useState(() =>
    getRoomExpiryState(normalizedCode)
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Check admin login
      const adminStored = localStorage.getItem("mcpa_admin_user");
      if (adminStored) {
        const parsedAdmin = JSON.parse(adminStored);
        if (parsedAdmin && (parsedAdmin.name || parsedAdmin.email)) {
          setInitialUser({
            name: parsedAdmin.name || "Engr. Raymart Quirante",
            role: "Lead Project Engineer",
            isAdmin: true,
            avatar_url: parsedAdmin.avatarUrl || parsedAdmin.avatar_url,
          });
          return;
        }
      }

      // Check client login
      const clientStored = localStorage.getItem("mcpa_client_user");
      if (clientStored) {
        const parsedClient = JSON.parse(clientStored);
        if (parsedClient && (parsedClient.name || parsedClient.fullName)) {
          setInitialUser({
            name: parsedClient.name || parsedClient.fullName,
            role: "Primary Client / Property Owner",
            isAdmin: false,
            avatar_url: parsedClient.avatarUrl || parsedClient.avatar_url,
          });
        }
      }
    } catch (e) {}
  }, []);

  // Live 1-second countdown when call has ended
  useEffect(() => {
    if (!callEnded) return;

    const updateExpiry = () => {
      setExpiryState(getRoomExpiryState(normalizedCode));
    };
    updateExpiry();

    const interval = setInterval(updateExpiry, 1000);
    return () => clearInterval(interval);
  }, [callEnded, normalizedCode]);

  const handleLobbyJoin = (participantData) => {
    clearRoomConcluded(normalizedCode);
    setJoinedParticipant(participantData);
    setCallEnded(false);
  };

  const handleCallLeave = () => {
    markRoomConcluded(normalizedCode);
    setExpiryState(getRoomExpiryState(normalizedCode));
    setCallEnded(true);
    setJoinedParticipant(null);
  };

  if (callEnded) {
    const isExpired = Boolean(expiryState?.isExpired);
    const remainingSec = Math.max(0, Math.ceil((expiryState?.remainingMs || 0) / 1000));
    const countdownLabel = `${Math.floor(remainingSec / 60)}:${String(remainingSec % 60).padStart(2, "0")}`;

    return (
      <div className="min-h-screen bg-[#0a0c10] text-neutral-100 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-[#0f1218] border border-white/[0.08] rounded-xl p-8 shadow-2xl">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border ${
              isExpired
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}
          >
            {isExpired ? <Clock className="w-6 h-6" /> : <Check className="w-6 h-6" />}
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            {isExpired ? "Consultation Room Expired" : "Consultation Concluded"}
          </h2>
          <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
            {isExpired
              ? `Room ${normalizedCode} expired 5 minutes after the call ended. Please generate or request a new room link for your next session.`
              : "Thank you for participating in the MCPA engineering & architectural review. Your consultation record has been logged."}
          </p>

          {!isExpired && remainingSec > 0 && (
            <div className="mt-4 py-2 px-3 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-amber-300 flex items-center justify-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Room expires in {countdownLabel}</span>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              disabled={isExpired}
              onClick={() => {
                if (isExpired) return;
                setCallEnded(false);
              }}
              className={`w-full py-2.5 px-4 rounded font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                isExpired
                  ? "bg-neutral-800 text-neutral-500 border border-white/10 cursor-not-allowed"
                  : "bg-amber-500 hover:bg-amber-400 text-black"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>
                {isExpired
                  ? "Room Expired (5m Limit Reached)"
                  : `Rejoin Meeting (${countdownLabel})`}
              </span>
            </button>

            <Link
              href="/portal?tab=meeting"
              className="w-full py-2.5 px-4 rounded bg-white/[0.04] hover:bg-white/[0.08] text-white border border-white/10 text-xs font-mono tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Open Client Portal</span>
            </Link>

            <Link
              href="/"
              className="w-full py-2.5 px-4 text-neutral-400 hover:text-white text-xs font-mono transition-colors flex items-center justify-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Back to Homepage</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active in call
  if (joinedParticipant) {
    return (
      <GoogleMeetRoom
        roomCode={normalizedCode}
        currentUser={{
          name: joinedParticipant.name,
          role: joinedParticipant.role,
          affiliation: joinedParticipant.affiliation,
          avatar_url: initialUser?.avatar_url,
          id: `guest-${Math.random().toString(36).substring(2, 9)}`,
        }}
        preloadedMediaStream={joinedParticipant.preloadedStream}
        initialMicOn={joinedParticipant.isMicOn}
        initialVideoOn={joinedParticipant.isVideoOn}
        initialCameraId={joinedParticipant.selectedCameraId}
        initialMicId={joinedParticipant.selectedMicId}
        initialAudioOutputId={joinedParticipant.selectedAudioOutputId}
        initialAudioOutputMode={joinedParticipant.audioOutputMode}
        isAdmin={joinedParticipant.affiliation === "mcpa"}
        onLeave={handleCallLeave}
      />
    );
  }

  // Pre-join Lobby
  return (
    <MeetPreJoinLobby
      roomCode={normalizedCode}
      initialUser={initialUser}
      onJoin={handleLobbyJoin}
    />
  );
}
