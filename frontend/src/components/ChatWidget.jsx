import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Flex,
  Text,
  Input,
  IconButton,
  Spinner,
  VStack,
  Avatar,
  Badge,
  Tooltip,
} from "@chakra-ui/react";
import { ArrowForwardIcon } from "@chakra-ui/icons";
import { connectSocket, disconnectSocket } from "../config/socket";
import { API_BASE_URL } from "../config/api";

const ChatWidget = ({ courseId, token }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimerRef = useRef(null);

  // ─── Scroll xuống cuối ───
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ─── Kết nối Socket + Fetch lịch sử ───
  useEffect(() => {
    if (!token || !courseId) return;

    const socket = connectSocket(token);
    socketRef.current = socket;

    // Fetch lịch sử chat
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/chat/messages/${courseId}`,
          {
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        setMessages(data.messages || []);
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Join room
    socket.emit("join-course", courseId);

    // Lắng nghe events
    socket.on("new-message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("user-typing", ({ userId, name, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          if (!prev.find((u) => u.userId === userId)) {
            return [...prev, { userId, name }];
          }
          return prev;
        } else {
          return prev.filter((u) => u.userId !== userId);
        }
      });
    });

    // Cleanup
    return () => {
      socket.emit("leave-course", courseId);
      socket.off("new-message");
      socket.off("user-typing");
    };
  }, [courseId, token]);

  // ─── Gửi tin nhắn ───
  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || sending) return;

    setSending(true);
    setInputValue("");

    // Emit typing stop
    socketRef.current?.emit("typing", { courseId, isTyping: false });

    socketRef.current?.emit("send-message", {
      courseId,
      content: text,
    });

    // Không set message ở đây vì sẽ nhận lại từ server qua "new-message"
    setTimeout(() => setSending(false), 500);
  };

  // ─── Typing indicator ───
  const handleInputChange = (e) => {
    setInputValue(e.target.value);

    if (!socketRef.current) return;

    // Emit typing mỗi 1 giây
    if (!typingTimerRef.current) {
      socketRef.current.emit("typing", { courseId, isTyping: true });
    }

    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit("typing", { courseId, isTyping: false });
      typingTimerRef.current = null;
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Format thời gian ───
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Box display="flex" flexDirection="column" h="100%" w="100%">
      {isLoading ? (
        <Flex justify="center" align="center" flex={1}>
          <Spinner size="sm" color="purple.500" />
        </Flex>
      ) : (
        <>
          {/* Messages area */}
          <VStack
            flex={1}
            spacing={3}
            p={3}
            overflowY="auto"
            align="stretch"
            css={{
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-track": { background: "#f1f1f1" },
              "&::-webkit-scrollbar-thumb": {
                background: "#cbd5e0",
                borderRadius: "3px",
              },
            }}
          >
            {messages.length === 0 ? (
              <Flex
                justify="center"
                align="center"
                flex={1}
                textAlign="center"
              >
                <Text fontSize="xs" color="gray.500">
                  Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện! 💬
                </Text>
              </Flex>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderId === socketRef.current?.userId;
                return (
                  <Flex
                    key={msg._id || idx}
                    w="100%"
                    justify={isMe ? "flex-end" : "flex-start"}
                    align="flex-end"
                    gap={2}
                  >
                    {!isMe && (
                      <Avatar
                        size="xs"
                        name={msg.senderName}
                        bg="purple.500"
                        color="white"
                      />
                    )}
                    <Box
                      maxW="80%"
                      bg={isMe ? "purple.500" : "gray.100"}
                      color={isMe ? "white" : "gray.800"}
                      px={3}
                      py={2}
                      borderRadius="lg"
                      borderBottomRightRadius={isMe ? "sm" : "lg"}
                      borderBottomLeftRadius={isMe ? "lg" : "sm"}
                      fontSize="xs"
                    >
                      {!isMe && (
                        <Text
                          fontSize="10px"
                          fontWeight="bold"
                          color={isMe ? "white" : "purple.600"}
                          mb={1}
                        >
                          {msg.senderName}
                          {msg.senderRole === "teacher" && (
                            <Badge ml={1} colorScheme="green" fontSize="8px">
                              GV
                            </Badge>
                          )}
                          {msg.senderRole === "admin" && (
                            <Badge ml={1} colorScheme="red" fontSize="8px">
                              Admin
                            </Badge>
                          )}
                        </Text>
                      )}
                      <Text lineHeight="1.4" whiteSpace="pre-wrap" wordBreak="break-word">
                        {msg.content}
                      </Text>
                      <Text
                        fontSize="9px"
                        color={isMe ? "whiteAlpha.700" : "gray.500"}
                        textAlign="right"
                        mt={1}
                      >
                        {formatTime(msg.createdAt)}
                      </Text>
                    </Box>
                  </Flex>
                );
              })
            )}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <Flex gap={2} align="center">
                <Text fontSize="10px" color="gray.500" fontStyle="italic">
                  {typingUsers.map((u) => u.name).join(", ")}{" "}
                  {typingUsers.length === 1 ? "đang" : "đang"} nhập...
                </Text>
              </Flex>
            )}

            <div ref={messagesEndRef} />
          </VStack>

          {/* Input area */}
          <Flex p={3} borderTop="1px solid" borderColor="gray.200" gap={2}>
            <Input
              placeholder="Nhập tin nhắn..."
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              isDisabled={sending}
              size="sm"
              borderRadius="md"
              bg="gray.50"
              _focus={{
                bg: "white",
                borderColor: "purple.500",
                boxShadow: "0 0 0 1px rgba(168, 85, 247, 0.5)",
              }}
            />
            <Tooltip label="Gửi (Enter)">
              <IconButton
                icon={sending ? <Spinner size="sm" /> : <ArrowForwardIcon />}
                onClick={handleSend}
                isDisabled={sending || !inputValue.trim()}
                colorScheme="purple"
                size="sm"
                borderRadius="md"
                aria-label="Send"
              />
            </Tooltip>
          </Flex>
        </>
      )}
    </Box>
  );
};

export default ChatWidget;