import { getFirebaseFirestore } from "@/lib/firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";

const CONVERSATIONS_COLLECTION = "mcpa_chatbot_conversations";
const MESSAGES_SUBCOLLECTION = "messages";

/**
 * Creates or updates the conversation metadata document in Firebase Firestore.
 */
export async function syncConversationToFirebase(conversationId, sessionData = {}) {
  try {
    const db = getFirebaseFirestore();
    if (!db || !conversationId) return false;

    const convRef = doc(db, CONVERSATIONS_COLLECTION, String(conversationId));
    const now = Date.now();

    const cleanEmail = sessionData.customerEmail
      ? String(sessionData.customerEmail).trim().toLowerCase()
      : null;

    const dataToSave = {
      conversationId: String(conversationId),
      customerName: sessionData.customerName || "Valued Client",
      customerEmail: cleanEmail,
      status: sessionData.status || "BOT_ACTIVE",
      updatedAt: now,
      lastActiveDevice: typeof navigator !== "undefined" ? navigator.userAgent : "Web Client",
    };

    if (sessionData.createdAt) {
      dataToSave.createdAt = sessionData.createdAt;
    }

    await setDoc(convRef, dataToSave, { merge: true });
    return true;
  } catch (err) {
    console.warn("[FirebaseChat] syncConversation error:", err.message);
    return false;
  }
}

/**
 * Saves a single chat message into the conversation's Firebase messages subcollection.
 */
export async function saveMessageToFirebase(conversationId, msg = {}) {
  try {
    const db = getFirebaseFirestore();
    if (!db || !conversationId) return false;

    const rawId = msg.message_id || msg.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const msgDocId = String(rawId);
    const msgRef = doc(db, CONVERSATIONS_COLLECTION, String(conversationId), MESSAGES_SUBCOLLECTION, msgDocId);

    const now = Date.now();
    const messageData = {
      message_id: msgDocId,
      messageId: msgDocId,
      sender_type: msg.sender_type || "bot",
      senderType: msg.sender_type || "bot",
      sender_id: msg.sender_id || null,
      message_text: msg.message_text || "",
      messageText: msg.message_text || "",
      metadata: msg.metadata || null,
      created_at: msg.created_at || new Date().toISOString(),
      timestamp: now,
    };

    await setDoc(msgRef, messageData, { merge: true });

    // Also update parent conversation last message preview and updatedAt
    const convRef = doc(db, CONVERSATIONS_COLLECTION, String(conversationId));
    await updateDoc(convRef, {
      updatedAt: now,
      last_message_preview: (msg.message_text || "").slice(0, 150),
    }).catch(() => {});

    return true;
  } catch (err) {
    console.warn("[FirebaseChat] saveMessage error:", err.message);
    return false;
  }
}

/**
 * Recovers a client's conversation history across any device using their registered account email.
 */
export async function recoverUserConversationFromFirebase(email) {
  try {
    const db = getFirebaseFirestore();
    if (!db || !email) return null;

    const cleanEmail = String(email).trim().toLowerCase();
    const convsQuery = query(
      collection(db, CONVERSATIONS_COLLECTION),
      where("customerEmail", "==", cleanEmail),
      orderBy("updatedAt", "desc"),
      limit(1)
    );

    const snapshot = await getDocs(convsQuery);
    if (snapshot.empty) return null;

    const convDoc = snapshot.docs[0];
    const conversation = convDoc.data();

    // Fetch messages for this conversation
    const msgsQuery = query(
      collection(db, CONVERSATIONS_COLLECTION, convDoc.id, MESSAGES_SUBCOLLECTION),
      orderBy("timestamp", "asc")
    );
    const msgsSnapshot = await getDocs(msgsQuery);

    const messages = [];
    msgsSnapshot.forEach((docSnap) => {
      messages.push(docSnap.data());
    });

    return {
      conversationId: convDoc.id,
      conversation,
      messages,
    };
  } catch (err) {
    console.warn("[FirebaseChat] recoverUserConversation error:", err.message);
    return null;
  }
}

/**
 * Listens in real-time to messages for an active conversation via Firestore onSnapshot.
 */
export function subscribeToFirebaseMessages(conversationId, onUpdate) {
  try {
    const db = getFirebaseFirestore();
    if (!db || !conversationId) return () => {};

    const msgsQuery = query(
      collection(db, CONVERSATIONS_COLLECTION, String(conversationId), MESSAGES_SUBCOLLECTION),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(
      msgsQuery,
      (snapshot) => {
        const liveMessages = [];
        snapshot.forEach((d) => liveMessages.push(d.data()));
        if (typeof onUpdate === "function") {
          onUpdate(liveMessages);
        }
      },
      (err) => {
        console.warn("[FirebaseChat] Realtime subscription warning:", err.message);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("[FirebaseChat] subscribe error:", err.message);
    return () => {};
  }
}
