"use client";
import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { FaPaperPlane } from 'react-icons/fa';
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase/config";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";

export default function Home() {
  const textareaRef = useRef(null);
  const [user] = useAuthState(auth);
  const router = useRouter();

  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [chat, setChat] = useState(null);
  const [error, setError] = useState(null);

  const API_KEY = "AIzaSyBz0Kk02RwVORdsiqfZ9I3htuPmOnX-DJk";
  const MODEL_NAME = "gemini-1.0-pro";
  const genAI = new GoogleGenerativeAI(API_KEY);
  const generationConfig = {
    temperature: 0.9,
    topP: 1,
    topK: 1,
    maxOutputTokens: 2048,
  };

  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  ];

  useEffect(() => {
    const initChat = async () => {
      try {
        const newChat = await genAI.getGenerativeModel({ model: MODEL_NAME }).startChat({
          generationConfig,
          safetySettings,
          history: messages.map((msg) => ({ text: msg.text, role: msg.role })),
        });
        setChat(newChat);
      } catch (error) {
        setError("Failed to initialize chat. Please try again.");
      }
    };
    initChat();
  }, []); // Run only once when component mounts

  const handleSendMessage = async () => {
    if (!chat) {
      setError("Chat is not initialized yet. Please wait.");
      return;
    }

    try {
      const userMessage = { text: userInput, role: "user", timestamp: new Date() };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setUserInput("");

      const result = await chat.sendMessage(userInput);
      const botMessage = { text: result.response.text(), role: "bot", timestamp: new Date() };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      setError("Failed to send message. Please try again.");
    }
  };


  const handleLogout = async () => {
    try {
      await signOut(auth); // Wait for sign-out to complete
      sessionStorage.removeItem('user'); // Optionally, remove other session data
      router.push('/sign-up'); // Redirect to login page or any other page
    } catch (error) {
      console.error("Error during logout:", error); // Log error for debugging
      // Optionally, you can set an error state to display a message in the UI
    }
  };

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height
      textarea.style.height = `${textarea.scrollHeight}px`; // Adjust height based on content
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen p-4 bg-gray-900">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-white">AI Chatbot</h1>
        <button
      className="text-white bg-purple-600 hover:bg-purple-700 rounded-md px-4 py-2 focus:outline-none transition-colors duration-300 ease-in-out"
      onClick={handleLogout} // Use the handler function here
    >
      Log Out
    </button>
      </div>
      <div className="flex-1 overflow-y-auto bg-gray-900 rounded-lg shadow-lg p-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`relative max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg p-2 rounded-xl ${
                msg.role === "user" ? "bg-purple-600 text-white" : "bg-gray-200 text-black"
              }`}
              style={{
                borderRadius: "20px",
                marginRight: msg.role === "user" ? "0" : "auto",
                marginLeft: msg.role === "user" ? "auto" : "0",
                padding: "10px 15px",
                overflowWrap: "break-word",
                wordBreak: "break-word",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      <div className="flex items-center mt-4">
        <textarea
          ref={textareaRef}
          placeholder="Type your message..."
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          className="flex-1 p-3 rounded-xl border border-gray-300 bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none overflow-hidden"
          rows={1} // Minimum height
          style={{ minHeight: '50px', maxHeight: '150px' }} // Adjust as needed
        />
        <button
          onClick={handleSendMessage}
          className="ml-2 p-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none transition-colors duration-300 ease-in-out"
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
}
