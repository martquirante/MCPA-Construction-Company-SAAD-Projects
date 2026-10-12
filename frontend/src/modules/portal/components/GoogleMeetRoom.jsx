"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Smile,
  Hand,
  MoreVertical,
  PhoneOff,
  MessageSquare,
  Users,
  Info,
  Shield,
  X,
  Send,
  Copy,
  Check,
  ChevronDown,
  Maximize2,
  Minimize2,
  Sparkles,
  Clock,
  AlertCircle,
  Zap,
  PhoneCall,
  SwitchCamera,
} from "lucide-react";
import { io } from "socket.io-client";
import { WebRTCPeerManager } from "@/modules/portal/utils/webrtcPeerManager";
import { getSignalingServerUrl } from "@/modules/portal/utils/signalingUrl";

export default function GoogleMeetRoom({
  roomCode = "fvv-rdoo-wfn",
  currentUser,
  activeProject,
  onLeave,
  onAutoEndTimeout,
  isInstantMeeting = false,
  isAdmin = false,
  showToast = () => {},
}) {
  const userRole = (currentUser?.role || "").toUpperCase();
  const isUserAdmin = isAdmin || userRole.includes("ADMIN") || userRole.includes("ENGINEER");

  const displayName =
    currentUser?.name || currentUser?.fullName || activeProject?.client_name || "Raymart Quirante";
  const userAvatar = currentUser?.avatar_url || currentUser?.avatarUrl;

  // Call Controls State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [facingMode, setFacingMode] = useState("user"); // "user" | "environment"

  // WebRTC & Socket.IO Signaling State
  const socketRef = useRef(null);
  const peerManagerRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const remotePeerRef = useRef(null);
  const userInfoRef = useRef({ displayName, userRole, isUserAdmin, userAvatar, currentUser, showToast });

  useEffect(() => {
    userInfoRef.current = { displayName, userRole, isUserAdmin, userAvatar, currentUser, showToast };
  });

  const [remoteStream, setRemoteStream] = useState(null);
  const [remotePeer, setRemotePeer] = useState(null);
  const [remoteMediaState, setRemoteMediaState] = useState({
    isMicOn: true,
    isVideoOn: true,
    isScreenSharing: false,
  });
  const [p2pConnectionState, setP2pConnectionState] = useState("idle"); // 'idle' | 'connecting' | 'connected' | 'disconnected'
  const [isRemoteHandRaised, setIsRemoteHandRaised] = useState(false);

  // Instant Meeting 3-Minute Timeout & Admin Sync State
  const [instantTimer, setInstantTimer] = useState(180); // 3 minutes = 180 seconds
  const [isCallAnswered, setIsCallAnswered] = useState(isUserAdmin);

  const remotePeerName =
    remotePeer?.name ||
    (isUserAdmin
      ? (activeProject?.client_name || "Client Participant")
      : "Engr. Raymart Quirante");

  const remotePeerAvatar =
    remotePeer?.avatarUrl || remotePeer?.avatar_url || null;

  const hasRemotePeer = Boolean(remoteStream && isCallAnswered);

  // AUTOMATIC FULLSCREEN BY DEFAULT & FLOATING PIP MODE
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isFloatingPiP, setIsFloatingPiP] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll only when full-screen and NOT floating
  useEffect(() => {
    if (isFullscreen && !isFloatingPiP && mounted && typeof document !== "undefined") {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isFullscreen, isFloatingPiP, mounted]);

  // AUTO PICTURE-IN-PICTURE & FLOATING MINI-WINDOW ON TAB SWITCH / DEVICE ACTIVITY
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        setIsFloatingPiP(true);
        try {
          const activeVideo = isScreenSharing ? screenVideoRef.current : localVideoRef.current;
          if (
            activeVideo &&
            document.pictureInPictureEnabled &&
            !document.pictureInPictureElement &&
            typeof activeVideo.requestPictureInPicture === "function"
          ) {
            await activeVideo.requestPictureInPicture();
          }
        } catch (e) {}
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isScreenSharing]);

  // When returning from native PiP back to tab
  useEffect(() => {
    const activeVideo = isScreenSharing ? screenVideoRef.current : localVideoRef.current;
    if (!activeVideo) return;
    const handleLeavePiP = () => {};
    activeVideo.addEventListener("leavepictureinpicture", handleLeavePiP);
    return () => {
      activeVideo.removeEventListener("leavepictureinpicture", handleLeavePiP);
    };
  }, [isScreenSharing]);

  // Theme Sync State - read active document state immediately
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  useEffect(() => {
    const checkTheme = () => {
      if (typeof document !== "undefined") {
        setIsDarkMode(document.documentElement.classList.contains("dark"));
      }
    };
    checkTheme();
    window.addEventListener("mcpa-theme-change", checkTheme);
    return () => window.removeEventListener("mcpa-theme-change", checkTheme);
  }, []);

  const handleLeaveCall = () => {
    try {
      if (typeof document !== "undefined" && document.pictureInPictureElement && document.exitPictureInPicture) {
        document.exitPictureInPicture().catch(() => {});
      }
      if (typeof document !== "undefined" && document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}

    if (socketRef.current) {
      try {
        socketRef.current.emit("leave-room", { roomCode });
        socketRef.current.disconnect();
      } catch (e) {}
    }

    if (peerManagerRef.current) {
      peerManagerRef.current.close();
    }

    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
    if (screenVideoRef.current?.srcObject) {
      screenVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }
    onLeave && onLeave();
  };

  // WebRTC Peer Connection & Socket.IO Signaling Lifecycle (Persistently Mounted)
  useEffect(() => {
    if (!mounted || !roomCode) return;

    const serverUrl = getSignalingServerUrl();
    console.log(`[WEBRTC] Connecting to signaling server at: ${serverUrl}`);

    const socket = io(serverUrl, {
      transports: ["polling", "websocket"],
      reconnectionAttempts: 10,
      timeout: 15000,
    });
    socketRef.current = socket;

    const peerManager = new WebRTCPeerManager({
      socket,
      roomCode,
      currentUser: {
        id: userInfoRef.current.currentUser?.id,
        name: userInfoRef.current.displayName,
        role: userInfoRef.current.userRole || (userInfoRef.current.isUserAdmin ? "ADMIN" : "CLIENT"),
        avatarUrl: userInfoRef.current.userAvatar,
      },
      onRemoteStream: (stream) => {
        console.log("[WEBRTC] Remote media stream received:", stream.id);
        setRemoteStream(stream);
        setIsCallAnswered(true);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
        }
      },
      onConnectionStateChange: (state) => {
        setP2pConnectionState(state);
        if (state === "connected") {
          setIsCallAnswered(true);
          userInfoRef.current.showToast?.("Live P2P encrypted media stream connected!");
        }
      },
      onPeerLeft: () => {
        setRemoteStream(null);
        setRemotePeer(null);
        remotePeerRef.current = null;
        setIsRemoteHandRaised(false);
        userInfoRef.current.showToast?.("Participant left the consultation.");
      },
    });
    peerManagerRef.current = peerManager;

    // Immediately pre-init peer connection if local stream is already available
    if (localStreamRef.current) {
      peerManager.initPeerConnection(localStreamRef.current);
    }

    const joinRoomPayload = () => {
      const u = userInfoRef.current;
      return {
        roomCode,
        user: {
          id: u.currentUser?.id,
          name: u.displayName,
          role: u.userRole || (u.isUserAdmin ? "ADMIN" : "CLIENT"),
          avatarUrl: u.userAvatar,
        },
        role: u.isUserAdmin ? "admin" : "client",
      };
    };

    socket.on("connect", () => {
      console.log(`[WEBRTC] Connected to signaling server with socket ID: ${socket.id}`);
      socket.emit("join-room", joinRoomPayload());
    });

    if (socket.connected) {
      socket.emit("join-room", joinRoomPayload());
    }

    // Newcomer receives existing participants
    socket.on("room-joined", ({ participants }) => {
      if (participants && participants.length > 0) {
        const peer = participants[0];
        console.log("[WEBRTC] Existing peer found in room:", peer);
        remotePeerRef.current = peer;
        setRemotePeer(peer);
        setIsCallAnswered(true);
        // New participant sends offer to existing peer
        peerManager.createAndSendOffer(peer.socketId);
      }
    });

    // Existing participant receives newcomer
    socket.on("user-joined", ({ socketId, user }) => {
      console.log("[WEBRTC] New participant joined room:", user?.name, socketId);
      const peer = { ...user, socketId };
      remotePeerRef.current = peer;
      setRemotePeer(peer);
      setIsCallAnswered(true);
      userInfoRef.current.showToast?.(`${user?.name || "Participant"} joined the consultation!`);
      // If no offer received within 2.5s, initiate offer as fallback
      setTimeout(() => {
        if (
          peerManagerRef.current &&
          !peerManagerRef.current.peerConnection?.remoteDescription &&
          !peerManagerRef.current.isInitiator
        ) {
          console.log("[WEBRTC] Fallback offer trigger for peer:", socketId);
          peerManagerRef.current.createAndSendOffer(socketId);
        }
      }, 2500);
    });

    socket.on("webrtc-offer", async ({ fromSocketId, sdpOffer, sender }) => {
      console.log("[WEBRTC] Received SDP offer from:", fromSocketId);
      const peer = { ...sender, socketId: fromSocketId };
      remotePeerRef.current = peer;
      setRemotePeer(peer);
      setIsCallAnswered(true);
      await peerManager.handleOfferAndSendAnswer(sdpOffer, fromSocketId);
    });

    socket.on("webrtc-answer", async ({ sdpAnswer }) => {
      console.log("[WEBRTC] Received SDP answer");
      await peerManager.handleAnswer(sdpAnswer);
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      await peerManager.handleIceCandidate(candidate);
    });

    socket.on("peer-state-updated", ({ isMicOn: mOn, isVideoOn: vOn, isScreenSharing: sOn }) => {
      setRemoteMediaState({ isMicOn: mOn, isVideoOn: vOn, isScreenSharing: sOn });
    });

    socket.on("chat-message-received", (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (msg.sender !== userInfoRef.current.displayName) {
        setUnreadCount((c) => c + 1);
      }
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 50);
    });

    socket.on("reaction-received", ({ id, emoji }) => {
      setFloatingReactions((prev) => [...prev, { id, emoji, left: Math.random() * 60 + 20 }]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
      }, 2800);
    });

    socket.on("peer-hand-raised", ({ isHandRaised: raised, from }) => {
      setIsRemoteHandRaised(Boolean(raised));
      if (raised) {
        userInfoRef.current.showToast?.(`✋ ${from || "Participant"} raised hand`);
      }
    });

    socket.on("peer-left", () => {
      setRemoteStream(null);
      setRemotePeer(null);
      remotePeerRef.current = null;
      setIsRemoteHandRaised(false);
      userInfoRef.current.showToast?.("Participant left the consultation.");
    });

    return () => {
      try {
        socket.emit("leave-room", { roomCode });
      } catch (e) {}
      peerManager.close();
      socket.disconnect();
    };
  }, [mounted, roomCode]);

  // Instant Meeting Admin Presence & 3-Minute Auto-End Timer
  useEffect(() => {
    if (!isInstantMeeting) return;

    // 1. If user is Admin joining the call, mark answered immediately
    if (isUserAdmin) {
      setIsCallAnswered(true);
      try {
        const stored = localStorage.getItem("mcpa_instant_call_active");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.answered = true;
          parsed.adminJoined = true;
          parsed.answeredBy = currentUser?.name || "Engr. Raymart Quirante";
          localStorage.setItem("mcpa_instant_call_active", JSON.stringify(parsed));
        }
        window.dispatchEvent(
          new CustomEvent("mcpa-instant-call-answered", {
            detail: { answeredBy: currentUser?.name || "Engr. Raymart Quirante" },
          })
        );
      } catch (e) {}
      return;
    }

    // 2. If client waiting for an Admin to answer
    if (isCallAnswered) return;

    // Check if call was already answered in localStorage
    const checkAnswered = () => {
      try {
        const stored = localStorage.getItem("mcpa_instant_call_active");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.answered || parsed.adminJoined) {
            setIsCallAnswered(true);
            showToast(`${parsed.answeredBy || "MCPA Engineering"} has connected to the consultation!`);
          }
        }
      } catch (e) {}
    };

    checkAnswered();

    const handleAnsweredEvent = (e) => {
      setIsCallAnswered(true);
      showToast(`${e.detail?.answeredBy || "Engr. Raymart Quirante"} has answered your call!`);
    };

    window.addEventListener("mcpa-instant-call-answered", handleAnsweredEvent);
    window.addEventListener("storage", checkAnswered);

    // 3-Minute (180s) Auto-End Countdown Timer
    const timerInterval = setInterval(() => {
      setInstantTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          // 3 minutes elapsed with no admin answering -> Auto End!
          handleLeaveCall();
          if (onAutoEndTimeout) {
            onAutoEndTimeout();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timerInterval);
      window.removeEventListener("mcpa-instant-call-answered", handleAnsweredEvent);
      window.removeEventListener("storage", checkAnswered);
    };
  }, [isInstantMeeting, isUserAdmin, isCallAnswered, onAutoEndTimeout, showToast]);

  // Side Drawers
  const [activeSidePanel, setActiveSidePanel] = useState(null); // null | 'chat' | 'people' | 'info'
  const [unreadCount, setUnreadCount] = useState(0);

  // Floating Reactions
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [isReactionsOpen, setIsReactionsOpen] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "Engr. Raymart Quirante",
      role: "Lead Project Engineer (Host)",
      time: "Just now",
      text: "Welcome to your MCPA Architectural & Engineering consultation! Feel free to ask questions or share your screen.",
      isHost: true,
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef(null);

  // Video Media Streams
  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Live Clock
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize Camera & Mic
  useEffect(() => {
    let active = true;
    async function startMedia() {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          const isHttp = typeof window !== "undefined" && !window.isSecureContext;
          throw new Error(
            isHttp
              ? "A secure connection (HTTPS or localhost) is required to access the camera and microphone."
              : "Camera and microphone access is not supported in this browser."
          );
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        if (peerManagerRef.current) {
          peerManagerRef.current.attachLocalTracks(stream);
          const targetPeerId = remotePeerRef.current?.socketId;
          if (
            targetPeerId &&
            !peerManagerRef.current.isInitiator &&
            !peerManagerRef.current.peerConnection?.remoteDescription
          ) {
            console.log("[WEBRTC] Media ready, sending offer to remote peer:", targetPeerId);
            peerManagerRef.current.createAndSendOffer(targetPeerId);
          }
        }
      } catch (err) {
        console.warn("Could not access camera/mic, falling back to avatar mode:", err?.message || err);
        setIsVideoOn(false);
      }
    }
    startMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Ensure local video element gets local stream assigned when view switches
  useEffect(() => {
    if (localStreamRef.current && localVideoRef.current) {
      if (localVideoRef.current.srcObject !== localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
  }, [isVideoOn, isCallAnswered, remoteStream]);

  // Ensure remote video and audio elements get remote stream assigned
  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream, remoteMediaState.isVideoOn, remoteMediaState.isScreenSharing, isCallAnswered]);

  // Toggle Video Track
  const toggleVideo = () => {
    let nextVideoState = !isVideoOn;
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        nextVideoState = !videoTracks[0].enabled;
        videoTracks[0].enabled = nextVideoState;
      }
    }
    setIsVideoOn(nextVideoState);
    if (socketRef.current?.connected) {
      socketRef.current.emit("peer-state-change", {
        roomCode,
        isMicOn,
        isVideoOn: nextVideoState,
        isScreenSharing,
      });
    }
  };

  // Toggle Audio Track
  const toggleAudio = () => {
    let nextMicState = !isMicOn;
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        nextMicState = !audioTracks[0].enabled;
        audioTracks[0].enabled = nextMicState;
      }
    }
    setIsMicOn(nextMicState);
    if (socketRef.current?.connected) {
      socketRef.current.emit("peer-state-change", {
        roomCode,
        isMicOn: nextMicState,
        isVideoOn,
        isScreenSharing,
      });
    }
  };

  // Flip Camera between Front & Rear on Mobile
  const flipCamera = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) {
      showToast("Camera switching is unavailable in this environment.");
      return;
    }
    const nextFacing = facingMode === "user" ? "environment" : "user";
    try {
      let newStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: nextFacing } },
          audio: false,
        });
      } catch (errExact) {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextFacing },
          audio: false,
        });
      }

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (localStreamRef.current && newVideoTrack) {
        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldVideoTrack) {
          oldVideoTrack.stop();
          localStreamRef.current.removeTrack(oldVideoTrack);
        }
        localStreamRef.current.addTrack(newVideoTrack);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }

        if (peerManagerRef.current) {
          await peerManagerRef.current.replaceVideoTrack(newVideoTrack);
        }
      }
      setFacingMode(nextFacing);
      showToast(`Switched to ${nextFacing === "user" ? "front" : "rear"} camera`);
    } catch (err) {
      console.warn("Could not switch camera:", err);
      showToast("Unable to switch camera device.");
    }
  };

  // Screen Sharing with WebRTC track replacement
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      showToast("Screen presentation ended.");

      if (peerManagerRef.current && localStreamRef.current) {
        const camTrack = localStreamRef.current.getVideoTracks()[0];
        if (camTrack) {
          await peerManagerRef.current.replaceVideoTrack(camTrack);
        }
      }
      if (socketRef.current?.connected) {
        socketRef.current.emit("peer-state-change", {
          roomCode,
          isMicOn,
          isVideoOn,
          isScreenSharing: false,
        });
      }
    } else {
      if (!navigator?.mediaDevices?.getDisplayMedia) {
        showToast("Screen sharing requires HTTPS and a supported desktop browser.");
        return;
      }
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;
        setIsScreenSharing(true);
        showToast("You are now presenting your screen to the consultation.");

        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = screenStream;
        }

        const screenTrack = screenStream.getVideoTracks()[0];
        if (peerManagerRef.current && screenTrack) {
          await peerManagerRef.current.replaceVideoTrack(screenTrack);
        }
        if (socketRef.current?.connected) {
          socketRef.current.emit("peer-state-change", {
            roomCode,
            isMicOn,
            isVideoOn,
            isScreenSharing: true,
          });
        }

        screenTrack.onended = async () => {
          setIsScreenSharing(false);
          screenStreamRef.current = null;
          showToast("Screen presentation ended.");
          if (peerManagerRef.current && localStreamRef.current) {
            const camTrack = localStreamRef.current.getVideoTracks()[0];
            if (camTrack) {
              await peerManagerRef.current.replaceVideoTrack(camTrack);
            }
          }
          if (socketRef.current?.connected) {
            socketRef.current.emit("peer-state-change", {
              roomCode,
              isMicOn,
              isVideoOn,
              isScreenSharing: false,
            });
          }
        };
      } catch (err) {
        console.warn("Screen share cancelled or not supported:", err);
      }
    }
  };

  // Send Reaction
  const triggerReaction = (emoji) => {
    const id = Date.now() + Math.random();
    setFloatingReactions((prev) => [...prev, { id, emoji, left: Math.random() * 60 + 20 }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2800);
    setIsReactionsOpen(false);

    if (socketRef.current?.connected) {
      socketRef.current.emit("send-reaction", { roomCode, emoji });
    }
  };

  // Toggle Hand Raise
  const toggleHandRaise = () => {
    const nextHand = !isHandRaised;
    setIsHandRaised(nextHand);
    if (socketRef.current?.connected) {
      socketRef.current.emit("toggle-hand-raise", { roomCode, isHandRaised: nextHand });
    }
  };

  // In-Call Chat Send via Socket.IO
  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      id: Date.now().toString(),
      sender: displayName,
      role: isUserAdmin ? "Lead Engineer (Host)" : "Client / Owner",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: chatInput.trim(),
      isHost: isUserAdmin,
    };

    if (socketRef.current?.connected) {
      socketRef.current.emit("send-chat-message", { roomCode, message: newMsg });
    } else {
      setMessages((prev) => [...prev, newMsg]);
    }

    setChatInput("");
    if (activeSidePanel !== "chat") {
      setUnreadCount((c) => c + 1);
    }

    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 50);
  };

  // Copy Meeting Link
  const [hasCopied, setHasCopied] = useState(false);
  const handleCopyLink = () => {
    const meetUrl = `${window.location.origin}/portal?tab=meeting&room=${roomCode}`;
    navigator.clipboard?.writeText(meetUrl);
    setHasCopied(true);
    showToast("Meeting code copied to clipboard!");
    setTimeout(() => setHasCopied(false), 2500);
  };  const roomContent = (
    <div
      className={`transition-all duration-300 flex flex-col justify-between select-none shadow-2xl ${
        isFloatingPiP
          ? "fixed bottom-5 right-5 z-[999999] w-[340px] sm:w-[380px] h-[270px] rounded-2xl bg-[#121316] border border-neutral-700/80 dark:border-white/20 overflow-hidden ring-1 ring-black/50"
          : isFullscreen
          ? "fixed inset-0 z-[99999] w-full h-[100dvh] max-w-none max-h-none rounded-none border-0 overflow-hidden bg-neutral-950 text-white"
          : "relative w-full h-[88vh] min-h-[600px] max-h-[960px] rounded-[16px] border border-neutral-800 overflow-hidden bg-neutral-950 text-white"
      } text-white`}
    >
      {/* Hidden audio element for receiving remote P2P audio track */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* 1. TOP STATUS BAR (COMPACT IN FLOATING MODE, MINIMALIST & TRANSPARENT IN FULLSCREEN) */}
      {isFloatingPiP ? (
        <div className="h-10 px-3 flex items-center justify-between z-20 shrink-0 bg-neutral-950/80 backdrop-blur-md border-b border-white/10 text-white">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-bold tracking-tight">MCPA Meet</span>
            <span className="text-[10px] font-mono text-neutral-400 truncate max-w-[100px]">
              {roomCode}
            </span>
            {isInstantMeeting && !isCallAnswered && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[9px] font-bold">
                {Math.floor(instantTimer / 60)}:{(instantTimer % 60).toString().padStart(2, "0")}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsFloatingPiP(false)}
            className="p-1 rounded-md text-neutral-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Expand to Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="h-12 sm:h-14 px-3 sm:px-6 flex items-center justify-between z-30 shrink-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent sm:bg-neutral-950/80 sm:backdrop-blur-md transition-colors text-white">
          {/* Left: Time & Room Code (NO CLUNKY BACKGROUND BOXES) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm font-sans font-medium text-white/90">
              {currentTimeStr || "5:56 PM"}
            </span>
            <span className="text-white/30 font-light">·</span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-xs font-mono font-medium text-white/80 hover:text-amber-400 transition-colors cursor-pointer group"
              title="Click to copy meeting code"
            >
              <span className="truncate max-w-[120px] sm:max-w-none">{roomCode}</span>
              {hasCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Copy className="w-3 h-3 text-white/50 group-hover:text-amber-400 transition-colors shrink-0" />
              )}
            </button>
            {activeProject?.project_title && (
              <span className="hidden md:inline-block text-xs font-mono text-white/50 whitespace-nowrap">
                · {activeProject.project_title}
              </span>
            )}
          </div>

          {/* Right: Actions (Flip Camera on Mobile, Instant Timer, User Avatar) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Flip Camera Button on Mobile Header */}
            {isVideoOn && (
              <button
                type="button"
                onClick={flipCamera}
                className="p-1.5 text-white/80 hover:text-white active:scale-90 transition-all cursor-pointer flex sm:hidden"
                title="Flip camera"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}

            {/* Instant Meeting Standby Timer Badge */}
            {isInstantMeeting && !isCallAnswered && (
              <div className="flex items-center gap-1.5 text-amber-400 font-mono text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                <span>{Math.floor(instantTimer / 60)}:{(instantTimer % 60).toString().padStart(2, "0")}</span>
              </div>
            )}

            {/* User Avatar (NO CLUNKY PILL BOX) */}
            <div className="flex items-center gap-2 text-white/90">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-[10px] text-amber-300">
                {userAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userAvatar} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <span className="hidden sm:inline text-xs font-medium text-white/90 truncate max-w-[120px]">
                {displayName.split(" ")[0]}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN STAGE CANVAS (PARTICIPANT TILES & SHARED SCREEN) */}
      <div className={`relative flex-1 flex min-h-0 ${isFloatingPiP ? "p-0" : "p-0 sm:px-6 sm:pb-2 sm:gap-4"} overflow-hidden bg-neutral-950`}>
        {/* Main Video Viewport */}
        <div className={`relative flex-1 ${isFloatingPiP ? "rounded-none" : "rounded-none sm:rounded-[16px]"} bg-neutral-950 flex items-center justify-center overflow-hidden`}>
          {/* INSTANT MEETING TOP STATUS BADGE (SLEEK & REFINED) */}
          {isInstantMeeting && !isCallAnswered && !isUserAdmin && !isFloatingPiP && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white font-mono text-xs flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              <span className="text-amber-400 font-medium">Connecting with MCPA Engineer...</span>
              <span className="text-white/40 font-light">·</span>
              <span className="text-amber-300 font-bold">
                {Math.floor(instantTimer / 60)}:{(instantTimer % 60).toString().padStart(2, "0")}
              </span>
            </div>
          )}

          {/* Dedicated Remote Audio Player (ALWAYS active to output peer audio through speaker) */}
          <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

          {/* ACTIVE MEDIA RENDERING */}
          {hasRemotePeer ? (
            /* DUAL CALL MODE: REMOTE PARTICIPANT ON MAIN STAGE */
            remoteMediaState.isScreenSharing ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono font-medium flex items-center gap-2 text-amber-400 shadow-lg">
                  <Monitor className="w-3.5 h-3.5 animate-pulse" />
                  <span>{remotePeerName} is presenting their screen</span>
                </div>
              </div>
            ) : isScreenSharing ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono font-medium flex items-center gap-2 text-amber-400 shadow-lg">
                  <Monitor className="w-3.5 h-3.5 animate-pulse" />
                  <span>You are presenting your screen</span>
                </div>
              </div>
            ) : remoteMediaState.isVideoOn !== false ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              /* REMOTE AVATAR FALLBACK */
              <div className="relative w-full h-full flex flex-col items-center justify-center space-y-4 bg-gradient-to-b from-neutral-900 to-neutral-950 transition-colors">
                <div className={`relative flex items-center justify-center ${remoteMediaState.isMicOn !== false ? "animate-pulse" : ""}`}>
                  <div className="absolute w-36 h-36 rounded-full bg-amber-500/10 blur-xl" />
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-neutral-800 border-2 border-neutral-700 shadow-xl flex items-center justify-center ring-4 ring-white/5 transition-all">
                    {remotePeerAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={remotePeerAvatar} alt={remotePeerName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold font-mono text-amber-400">
                        {remotePeerName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white/90">{remotePeerName}</p>
                  <p className="text-xs font-mono text-white/50">Camera turned off</p>
                </div>
              </div>
            )
          ) : (
            /* SINGLE PARTICIPANT MODE / STANDBY */
            isScreenSharing ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-xs font-mono font-medium flex items-center gap-2 text-amber-400 shadow-lg">
                  <Monitor className="w-3.5 h-3.5 animate-pulse" />
                  <span>You are presenting your screen</span>
                </div>
              </div>
            ) : isVideoOn ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""}`}
                />
              </div>
            ) : (
              /* AVATAR CALLING / STANDBY STAGE */
              <div className="relative w-full h-full flex flex-col items-center justify-center space-y-4 bg-gradient-to-b from-[#14151a] to-[#0d0e12] transition-colors p-4">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-40 h-40 rounded-full bg-amber-500/15 blur-2xl animate-pulse" />
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-neutral-800 border-2 border-neutral-700 shadow-2xl flex items-center justify-center ring-4 ring-white/10 transition-all">
                    {userAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={userAvatar} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold font-mono text-amber-400">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                {isInstantMeeting && !isCallAnswered && (
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-white/90">
                      Calling Engr. Raymart Quirante
                    </p>
                    <p className="text-xs font-mono text-amber-400/90">
                      Standby for engineering response...
                    </p>
                  </div>
                )}
              </div>
            )
          )}

          {/* Bottom Left: Participant Name Tag (CLEAN TEXT, NO CLUNKY BOX BG) */}
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10 font-sans font-medium text-white/90 drop-shadow-md flex items-center gap-1.5 text-xs">
            <span className="font-semibold">{hasRemotePeer ? remotePeerName : displayName}</span>
            {hasRemotePeer ? (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
                {isUserAdmin ? "Client" : "Consultant"}
              </span>
            ) : (
              <span className="text-[10px] font-mono text-white/50">(You)</span>
            )}
            {(hasRemotePeer ? isRemoteHandRaised : isHandRaised) && (
              <span className="text-[11px] animate-bounce">✋ Hand Raised</span>
            )}
          </div>

          {/* Top Right: Tile Audio Indicator (ONLY SHOW WHEN MUTED) */}
          {!(hasRemotePeer ? remoteMediaState.isMicOn !== false : isMicOn) && (
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-1.5 rounded-full bg-rose-600/90 text-white shadow-md">
              <MicOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          )}

          {/* Floating Picture-in-Picture Tile (ONLY IN-CALL FOR LOCAL SELF-VIEW) */}
          {!isFloatingPiP && hasRemotePeer && (
            <div className="absolute bottom-20 sm:bottom-4 right-3 sm:right-4 z-10 w-24 h-32 sm:w-56 sm:h-36 rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-neutral-900 transition-all">
              <div className="relative w-full h-full flex items-center justify-center">
                {isVideoOn ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""}`}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-800 text-neutral-300">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
                {/* Self name overlay */}
                <div className="absolute bottom-1 left-1.5 text-[9px] font-mono text-white/80 drop-shadow-xs">
                  You {!isMicOn && <span className="text-rose-400">🔇</span>}
                </div>
              </div>
            </div>
          )}

          {/* Floating Reactions Emojis */}
          {floatingReactions.map((r) => (
            <div
              key={r.id}
              style={{ left: `${r.left}%` }}
              className="absolute bottom-20 text-3xl pointer-events-none animate-in fade-in slide-out-to-top duration-1000 z-30"
            >
              {r.emoji}
            </div>
          ))}
        </div>

        {/* 3. SLIDING RIGHT SIDE PANEL (CHAT, PEOPLE, INFO - RESPONSIVE MODAL ON MOBILE) */}
        {activeSidePanel && !isFloatingPiP && (
          <aside className="fixed inset-0 sm:relative sm:inset-auto z-40 w-full sm:w-88 h-full sm:rounded-[16px] bg-[#14151a] border-0 sm:border sm:border-white/10 flex flex-col shadow-2xl overflow-hidden text-white animate-in slide-in-from-bottom sm:slide-in-from-right-4 duration-200">
            {/* Panel Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-white/[0.08] flex items-center justify-between">
              <h3 className="text-sm font-sans font-bold text-neutral-900 dark:text-white capitalize">
                {activeSidePanel === "chat" && "In-call messages"}
                {activeSidePanel === "people" && `People (${hasRemotePeer ? "2" : "1"})`}
                {activeSidePanel === "info" && "Meeting details"}
              </h3>
              <button
                type="button"
                onClick={() => setActiveSidePanel(null)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CHAT PANEL */}
            {activeSidePanel === "chat" && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-3 bg-neutral-50 dark:bg-white/[0.02] border-b border-neutral-200/60 dark:border-white/[0.04] text-[11px] text-neutral-500 dark:text-neutral-400 font-sans text-center">
                  Messages can be seen only by people in the call.
                </div>

                {/* Messages Feed */}
                <div
                  ref={chatScrollRef}
                  className="flex-1 p-4 overflow-y-auto space-y-3.5 min-h-0 text-xs"
                >
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col space-y-1 ${
                        msg.isMe ? "items-end" : "items-start"
                      }`}
                    >
                      <div className="flex items-center gap-2 text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">
                        <span className="font-bold text-neutral-700 dark:text-neutral-300">{msg.sender}</span>
                        <span>{msg.time}</span>
                      </div>
                      <div
                        className={`p-3 rounded-[12px] max-w-[85%] font-sans text-xs break-words leading-relaxed ${
                          msg.isMe
                            ? "bg-amber-500 text-neutral-950 font-medium rounded-tr-none shadow-xs"
                            : "bg-neutral-100 dark:bg-white/[0.08] text-neutral-900 dark:text-neutral-100 rounded-tl-none border border-neutral-200 dark:border-white/5"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-neutral-200 dark:border-white/[0.08] flex items-center gap-2 bg-neutral-50/50 dark:bg-[#14151a]"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Send a message to everyone"
                    className="flex-1 px-3.5 py-2.5 rounded-full bg-white dark:bg-white/[0.06] border border-neutral-300 dark:border-white/10 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="p-2.5 rounded-full bg-amber-500 disabled:bg-neutral-200 dark:disabled:bg-white/10 text-neutral-950 disabled:text-neutral-400 dark:disabled:text-neutral-500 transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
                    title="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* PEOPLE PANEL */}
            {activeSidePanel === "people" && (
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                <div className="text-[11px] font-mono uppercase text-neutral-400 font-bold tracking-wider">
                  In Call ({hasRemotePeer ? "2" : "1"})
                </div>

                <div className="space-y-3">
                  {/* Local User */}
                  <div className="flex items-center justify-between p-2.5 rounded-[8px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-white flex items-center justify-center font-bold text-xs">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <span>{displayName}</span>
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">(You)</span>
                          {isHandRaised && <span>✋</span>}
                        </div>
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                          {isUserAdmin ? "Lead Engineer (Host)" : "Client / Property Owner"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isMicOn ? (
                        <Mic className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <MicOff className="w-4 h-4 text-rose-500" />
                      )}
                    </div>
                  </div>

                  {/* Remote User (If connected) */}
                  {hasRemotePeer ? (
                    <div className="flex items-center justify-between p-2.5 rounded-[8px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                          {remotePeerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                            <span>{remotePeerName}</span>
                            <span className="px-1.5 py-0.2 rounded-[2px] bg-amber-500/20 text-amber-700 dark:text-amber-400 font-mono text-[9px] uppercase font-bold">
                              {isUserAdmin ? "Client" : "Consultant"}
                            </span>
                            {isRemoteHandRaised && <span>✋</span>}
                          </div>
                          <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                            {isUserAdmin ? "Client Participant" : "Lead Project Engineer"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {remoteMediaState.isMicOn !== false ? (
                          <Mic className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <MicOff className="w-4 h-4 text-rose-500" />
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-[8px] bg-neutral-50 dark:bg-white/[0.02] border border-dashed border-neutral-300 dark:border-white/10 text-center">
                      <p className="text-xs font-sans text-neutral-600 dark:text-neutral-400">
                        Waiting for other participant to connect...
                      </p>
                      <p className="text-[10px] font-mono text-neutral-400 mt-1">
                        Code: {roomCode}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* INFO PANEL */}
            {activeSidePanel === "info" && (
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400 uppercase">
                    Joining Information
                  </h4>
                  <p className="text-xs text-neutral-700 dark:text-neutral-300 font-sans">
                    Room Code: <span className="font-mono font-bold text-neutral-900 dark:text-white">{roomCode}</span>
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Direct access for client engineering consultation.
                  </p>
                  <div className="pt-1 flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Automatic End-to-End Encryption (256-bit TLS)</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[8px] bg-neutral-100 dark:bg-white/[0.08] hover:bg-neutral-200 dark:hover:bg-white/[0.12] text-xs font-mono font-bold text-neutral-900 dark:text-white transition-colors cursor-pointer border border-neutral-200 dark:border-0"
                >
                  {hasCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{hasCopied ? "Copied" : "Copy Joining Link"}</span>
                </button>

                <div className="pt-4 border-t border-neutral-200 dark:border-white/[0.08] space-y-2">
                  <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 uppercase font-bold">
                    Project Parameters
                  </span>
                  <div className="p-3 rounded-[8px] bg-neutral-50 dark:bg-white/[0.03] border border-neutral-200 dark:border-0 text-xs space-y-1">
                    <div className="text-neutral-500 dark:text-neutral-400 text-[10px] font-mono">PROJECT TITLE</div>
                    <div className="font-bold text-neutral-900 dark:text-white">{activeProject?.project_title || "Residential Build Inquiry"}</div>
                    <div className="text-neutral-500 dark:text-neutral-400 text-[10px] font-mono mt-1">PROJECT CODE</div>
                    <div className="font-mono text-amber-600 dark:text-amber-400 font-bold">{activeProject?.project_code}</div>
                  </div>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* 4. BOTTOM FLOATING DOCK (COMPACT IN FLOATING MODE, FULL IN NORMAL MODE) */}
      {isFloatingPiP ? (
        <div className="h-12 px-3 flex items-center justify-between z-20 shrink-0 bg-neutral-950/90 backdrop-blur-md border-t border-white/10">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleAudio}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isMicOn ? "bg-white/15 hover:bg-white/25 text-white" : "bg-red-500 text-white"
              }`}
              title={isMicOn ? "Mute mic" : "Unmute mic"}
            >
              {isMicOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={toggleVideo}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isVideoOn ? "bg-white/15 hover:bg-white/25 text-white" : "bg-red-500 text-white"
              }`}
              title={isVideoOn ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFloatingPiP(false)}
              className="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-[11px] font-sans font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title="Expand to Fullscreen"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Expand</span>
            </button>
            <button
              type="button"
              onClick={handleLeaveCall}
              className="px-2.5 py-1 rounded-full bg-[#ea4335] hover:bg-[#d93025] text-white text-[11px] font-sans font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Leave call"
            >
              <PhoneOff className="w-3 h-3" />
              <span>Leave</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="h-auto min-h-[64px] sm:h-20 px-3 sm:px-6 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom,12px))] flex items-center justify-between z-30 shrink-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent sm:bg-neutral-950/95 sm:backdrop-blur-md transition-colors text-white">
          {/* Left: Meeting Details Shortcut (Desktop only) */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-white/50">
            <span className="text-white font-bold">{roomCode}</span>
          </div>

          {/* Center: Primary Call Controls (NO HEAVY BOX BACKGROUNDS!) */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-3 flex-1 sm:flex-initial">
            {/* Microphone Button */}
            <button
              type="button"
              onClick={toggleAudio}
              className={`p-3 rounded-full transition-all cursor-pointer ${
                isMicOn
                  ? "text-white/90 hover:text-white hover:bg-white/10 active:scale-90"
                  : "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-950/40 ring-1 ring-white/20 active:scale-90"
              }`}
              title={isMicOn ? "Turn off microphone (Ctrl + d)" : "Turn on microphone (Ctrl + d)"}
            >
              {isMicOn ? <Mic className="w-5 h-5 sm:w-5 sm:h-5" /> : <MicOff className="w-5 h-5 sm:w-5 sm:h-5" />}
            </button>

            {/* Camera Button */}
            <button
              type="button"
              onClick={toggleVideo}
              className={`p-3 rounded-full transition-all cursor-pointer ${
                isVideoOn
                  ? "text-white/90 hover:text-white hover:bg-white/10 active:scale-90"
                  : "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-950/40 ring-1 ring-white/20 active:scale-90"
              }`}
              title={isVideoOn ? "Turn off camera (Ctrl + e)" : "Turn on camera (Ctrl + e)"}
            >
              {isVideoOn ? <Video className="w-5 h-5 sm:w-5 sm:h-5" /> : <VideoOff className="w-5 h-5 sm:w-5 sm:h-5" />}
            </button>

            {/* Flip Camera (Mobile Only) */}
            {isVideoOn && (
              <button
                type="button"
                onClick={flipCamera}
                className="p-3 rounded-full text-white/90 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer flex sm:hidden"
                title="Switch front/rear camera"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
            )}

            {/* Screen Share Button (Desktop & Tablet only) */}
            <button
              type="button"
              onClick={handleToggleScreenShare}
              className={`hidden sm:inline-flex p-3 rounded-full transition-all cursor-pointer ${
                isScreenSharing
                  ? "bg-amber-500 text-neutral-950 font-bold"
                  : "text-white/90 hover:text-white hover:bg-white/10 active:scale-90"
              }`}
              title={isScreenSharing ? "Stop presenting" : "Present now (Share screen)"}
            >
              <Monitor className="w-5 h-5" />
            </button>

            {/* Reactions Button with Popup */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsReactionsOpen(!isReactionsOpen)}
                className={`p-3 rounded-full transition-all cursor-pointer ${
                  isReactionsOpen
                    ? "text-amber-400 bg-white/10"
                    : "text-white/90 hover:text-white hover:bg-white/10 active:scale-90"
                }`}
                title="Send a reaction"
              >
                <Smile className="w-5 h-5" />
              </button>

              {isReactionsOpen && (
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 p-2 rounded-full bg-neutral-900/95 border border-white/10 backdrop-blur-md shadow-2xl flex items-center gap-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                  {["💖", "👍", "🎉", "👏", "😂", "😮"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => triggerReaction(emoji)}
                      className="p-2 rounded-full hover:bg-white/10 text-xl transition-transform hover:scale-125 cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Raise Hand Button */}
            <button
              type="button"
              onClick={toggleHandRaise}
              className={`p-3 rounded-full transition-all cursor-pointer ${
                isHandRaised
                  ? "text-amber-400 bg-amber-500/20 scale-110 ring-1 ring-amber-400/40"
                  : "text-white/90 hover:text-white hover:bg-white/10 active:scale-90"
              }`}
              title={isHandRaised ? "Lower hand" : "Raise hand"}
            >
              <Hand className="w-5 h-5" />
            </button>

            {/* Float / Picture-in-Picture Button (Desktop only) */}
            <button
              type="button"
              onClick={() => setIsFloatingPiP(true)}
              className="hidden sm:inline-flex p-3 rounded-full text-white/90 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
              title="Float mini window (Picture-in-picture)"
            >
              <Minimize2 className="w-5 h-5" />
            </button>

            {/* End Call Button (Red Accent) */}
            <button
              type="button"
              onClick={handleLeaveCall}
              className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white transition-all cursor-pointer shadow-lg shadow-rose-950/40 flex items-center gap-2"
              title="Leave call"
            >
              <PhoneOff className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline text-xs font-bold font-sans uppercase tracking-wider">Leave</span>
            </button>
          </div>

          {/* Right: Drawer Toggles (Info, People, Chat) */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Chat Button with Unread Badge */}
            <button
              type="button"
              onClick={() => {
                setActiveSidePanel(activeSidePanel === "chat" ? null : "chat");
                setUnreadCount(0);
              }}
              className={`relative p-2.5 sm:p-3 rounded-full transition-colors cursor-pointer ${
                activeSidePanel === "chat"
                  ? "text-amber-400 bg-white/10"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
              title="Chat with everyone"
            >
              <MessageSquare className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            {/* People Button (Desktop) */}
            <button
              type="button"
              onClick={() => setActiveSidePanel(activeSidePanel === "people" ? null : "people")}
              className={`hidden sm:inline-flex p-2.5 sm:p-3 rounded-full transition-colors cursor-pointer ${
                activeSidePanel === "people"
                  ? "text-amber-400 bg-white/10"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
              title="People"
            >
              <Users className="w-5 h-5" />
            </button>

            {/* Info Details Button (Desktop) */}
            <button
              type="button"
              onClick={() => setActiveSidePanel(activeSidePanel === "info" ? null : "info")}
              className={`hidden sm:inline-flex p-2.5 sm:p-3 rounded-full transition-colors cursor-pointer ${
                activeSidePanel === "info"
                  ? "text-amber-400 bg-white/10"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
              title="Meeting details"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(roomContent, document.body);
}
