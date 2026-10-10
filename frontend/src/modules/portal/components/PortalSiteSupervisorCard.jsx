"use client";
import { useState } from "react";
import Image from "next/image";
import {
  Phone,
  Video,
  MessageSquare,
  Send,
  X,
  Paperclip,
  Camera,
  Play,
  ShieldCheck,
  CheckCheck,
} from "lucide-react";

export default function PortalSiteSupervisorCard({
  leadEngineer = "Engr. Aris Reyes",
  phoneNumber = "+63 949 775 8239",
  email = "aris.reyes@mcpaprojects.ph",
}) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: "client",
      text: "Good morning Engr. Reyes, any update po sa progress today?",
      time: "10:12 AM",
    },
    {
      id: 2,
      sender: "engineer",
      text: "Good morning! Concrete pouring for 2nd floor slab is completed. Passed QA test. Here is the slump test result.",
      time: "10:20 AM",
      image: "https://images.unsplash.com/photo-1541888946425-d0fbb186156f?q=80&w=800",
      imageCaption: "Slump Test: 8.5 cm (Passed Structural QC)",
    },
    {
      id: 3,
      sender: "engineer",
      isAudio: true,
      audioDuration: "0:12",
      time: "10:30 AM",
    },
    {
      id: 4,
      sender: "client",
      text: "Noted po! Thank you Engr.",
      time: "10:32 AM",
    },
  ]);

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!inputMsg.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: "client",
      text: inputMsg,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputMsg("");

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "engineer",
          text: "Copy po! Field team is monitoring formwork curing and MEP alignments.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 1500);
  };

  return (
    <>
      <div className="rounded-[20px] sm:rounded-[24px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/5 p-5 sm:p-7 shadow-xs space-y-4 transition-colors">
        {/* Header Label (Clean text, no bulky background pill) */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
            Site Supervisor
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-amber-600 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Active on Site</span>
          </div>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-3.5">
          <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-amber-500/40 bg-neutral-900 shrink-0 shadow-sm">
            <Image
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400"
              alt={leadEngineer}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white truncate">
              {leadEngineer}
            </h4>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
              Lead Project Engineer • PRC Licensed
            </p>
          </div>
        </div>

        {/* Action Buttons (Real buttons with proper styling) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
          <a
            href={`tel:${phoneNumber}`}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[12px] bg-amber-500 hover:bg-amber-400 text-neutral-950 font-mono font-bold text-xs transition-colors shadow-xs"
            title="Direct Voice Call"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Voice Call</span>
          </a>

          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[12px] bg-neutral-900 hover:bg-neutral-800 dark:bg-white/10 dark:hover:bg-white/15 text-white font-mono font-bold text-xs transition-colors shadow-xs cursor-pointer"
            title="Open Interactive Chat"
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            <span>Message</span>
          </button>

          <button
            type="button"
            onClick={() => alert(`Starting video consultation with ${leadEngineer}...`)}
            className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[12px] bg-neutral-100 hover:bg-neutral-200 dark:bg-white/5 dark:hover:bg-white/10 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-mono font-bold text-xs transition-colors shadow-xs cursor-pointer"
            title="Launch Video Inspection Stream"
          >
            <Video className="w-3.5 h-3.5 text-amber-500" />
            <span>Video Call</span>
          </button>
        </div>

        {/* Contact Meta Details (Clean text only, no box background) */}
        <div className="pt-2 border-t border-neutral-100 dark:border-white/5 flex flex-wrap items-center justify-between text-[11px] font-mono text-neutral-400">
          <span>{phoneNumber}</span>
          <span className="truncate">{email}</span>
        </div>
      </div>

      {/* Interactive Chat Slide-Over Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg h-[92vh] max-h-[680px] rounded-[24px] bg-white dark:bg-[#101218] border border-neutral-200 dark:border-white/10 flex flex-col shadow-2xl overflow-hidden">
            {/* Chat Top Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-800 border border-amber-500/30">
                  <Image
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400"
                    alt={leadEngineer}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                    <span>{leadEngineer}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  </h4>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-amber-600 dark:text-amber-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Active on Site 2</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Message Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#f8f7f5] dark:bg-[#0a0c10]">
              {chatMessages.map((msg) => {
                const isMe = msg.sender === "client";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-[18px] p-3 text-xs shadow-xs ${
                        isMe
                          ? "bg-amber-500 text-neutral-950 font-medium rounded-br-xs"
                          : "bg-white dark:bg-[#161922] text-neutral-900 dark:text-white border border-neutral-200 dark:border-white/5 rounded-bl-xs"
                      }`}
                    >
                      {msg.text && <p className="leading-relaxed">{msg.text}</p>}

                      {/* Photo Attachment inside chat */}
                      {msg.image && (
                        <div className="mt-2 space-y-1.5">
                          <div className="relative aspect-video rounded-[12px] overflow-hidden bg-neutral-900 border border-black/10">
                            <Image
                              src={msg.image}
                              alt="Site attachment"
                              fill
                              sizes="320px"
                              className="object-cover"
                            />
                          </div>
                          {msg.imageCaption && (
                            <span className="inline-block text-[10px] font-mono font-bold text-neutral-600 dark:text-neutral-300">
                              {msg.imageCaption}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Simulated Audio Waveform Voice Note */}
                      {msg.isAudio && (
                        <div className="flex items-center gap-2.5 py-1">
                          <button
                            type="button"
                            className="w-7 h-7 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center shrink-0 shadow-xs"
                          >
                            <Play className="w-3 h-3 fill-current ml-0.5" />
                          </button>
                          <div className="flex items-center gap-0.5 flex-1 h-4">
                            {[12, 18, 8, 22, 14, 28, 10, 20, 16, 24, 8, 14, 18, 10].map((h, i) => (
                              <div
                                key={i}
                                className="w-1 bg-amber-500/60 rounded-full"
                                style={{ height: `${h}px` }}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-mono text-neutral-400">
                            {msg.audioDuration}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-[9.5px] font-mono text-neutral-400">
                        {msg.time}
                      </span>
                      {isMe && <CheckCheck className="w-3 h-3 text-amber-500" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-neutral-200 dark:border-white/10 bg-white dark:bg-[#101218] flex items-center gap-2"
            >
              <div className="flex items-center gap-1 text-neutral-400">
                <button
                  type="button"
                  className="p-1.5 hover:text-neutral-900 dark:hover:text-white rounded-full transition-colors cursor-pointer"
                  title="Attach Photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:text-neutral-900 dark:hover:text-white rounded-full transition-colors cursor-pointer"
                  title="Attach Document"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Type your message to Engr. Reyes..."
                className="flex-1 px-3.5 py-2 rounded-full bg-neutral-100 dark:bg-white/5 border border-transparent focus:border-amber-500 focus:outline-none text-xs text-neutral-900 dark:text-white"
              />

              <button
                type="submit"
                disabled={!inputMsg.trim()}
                className="w-8 h-8 rounded-full bg-amber-500 disabled:opacity-40 text-neutral-950 flex items-center justify-center transition-opacity cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
