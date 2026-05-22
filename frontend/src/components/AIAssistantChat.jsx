import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  IconButton,
  Spinner,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import { ArrowForwardIcon } from '@chakra-ui/icons';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AIAssistantChat = ({ courseId, token, containerHeight = 'auto' }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setError(null);

    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      text: userMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/ai-assistant/ask`,
        {
          courseId: courseId,
          question: userMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        text: response.data.response,
        isWithinContext: response.data.isWithinContext,
        tokensUsed: response.data.tokensUsed,
        timestamp: response.data.timestamp,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.log("Chi tiết lỗi Axios:", err.response || err);
      console.error('Error:', err);

      let errorMessage = 'Không thể kết nối với AI Assistant';
      if (err.response?.status === 403) {
        errorMessage = 'Bạn không có quyền truy cập khóa học này';
      } else if (err.response?.status === 400) {
        errorMessage = err.response.data.message || errorMessage;
      }

      setError(errorMessage);

      const errorMsg = {
        id: Date.now() + 1,
        type: 'error',
        text: errorMessage,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      h={containerHeight}
      w="100%"
    >
      <VStack
        flex={1}
        spacing={3}
        p={3}
        overflowY="auto"
        align="flex-start"
        ref={messagesContainerRef}
        css={{
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#cbd5e0',
            borderRadius: '3px',
          },
        }}
      >
        {messages.length === 0 && !isLoading && (
          <Box w="100%" p={3} textAlign="center">
            <Text fontSize="xs" color="gray.500">
              👋 Hỏi tôi bất kỳ câu hỏi nào về khóa học
            </Text>
          </Box>
        )}

        {messages.map((message) => (
          <HStack
            key={message.id}
            w="100%"
            justify={message.type === 'user' ? 'flex-end' : 'flex-start'}
            align="flex-start"
            spacing={2}
          >
            <Box
              maxW="85%"
              bg={message.type === 'user' ? 'purple.500' : message.type === 'error' ? 'red.100' : 'gray.100'}
              color={message.type === 'user' ? 'white' : message.type === 'error' ? 'red.800' : 'black'}
              p={2}
              borderRadius="lg"
              fontSize="xs"
              // CSS để render Markdown đẹp
              sx={{
                '& p': { lineHeight: '1.5', mb: 1 },
                '& ul, & ol': { ml: 4, mb: 2 },
                '& li': { mb: 0.5 },
                '& h3': { fontSize: 'sm', fontWeight: 'bold', mt: 2, mb: 1 },
                '& pre': {
                  bg: 'gray.800',
                  color: 'gray.100',
                  p: 2,
                  borderRadius: 'md',
                  my: 2,
                  overflowX: 'auto',
                  fontFamily: 'monospace'
                },
                '& code': { fontWeight: 'bold', bg: 'blackAlpha.200', p: '2px 4px', borderRadius: 'sm' },
                '& pre code': { bg: 'transparent', p: 0, fontWeight: 'normal' }
              }}
            >
              {/* AI dùng Markdown, User dùng Plain Text */}
              {message.type === 'ai' ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.text}
                </ReactMarkdown>
              ) : (
                <Text lineHeight="1.4" whiteSpace="pre-wrap" wordBreak="break-word">
                  {message.text}
                </Text>
              )}

              {message.type === 'ai' && (
                <HStack spacing={1} mt={1} pt={1} borderTop="1px solid" borderColor="gray.300">
                  <Badge
                    size="sm"
                    colorScheme={message.isWithinContext ? 'green' : 'orange'}
                    fontSize="9px"
                  >
                    {message.isWithinContext ? '✓ OK' : '⚠ Out'}
                  </Badge>
                </HStack>
              )}
            </Box>
          </HStack>
        ))}

        {isLoading && (
          <HStack spacing={2}>
            <Spinner size="sm" color="purple.500" />
            <Text fontSize="xs" color="gray.500">
              Đang suy nghĩ...
            </Text>
          </HStack>
        )}

        <div ref={messagesEndRef} />
      </VStack>

      <Box p={3} borderTop="1px solid" borderColor="gray.200">
        {error && (
          <Box mb={2} p={2} bg="red.50" borderRadius="md" borderLeft="3px solid" borderColor="red.500">
            <Text fontSize="9px" color="red.700">
              {error}
            </Text>
          </Box>
        )}

        <HStack spacing={2}>
          <Input
            ref={inputRef}
            placeholder="Hỏi..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError(null);
            }}
            onKeyPress={handleKeyPress}
            isDisabled={isLoading}
            size="sm"
            borderRadius="md"
            bg="gray.50"
            _focus={{
              bg: 'white',
              borderColor: 'purple.500',
              boxShadow: '0 0 0 1px rgba(168, 85, 247, 0.5)',
            }}
          />
          <Tooltip label="Gửi (Enter)">
            <IconButton
              icon={isLoading ? <Spinner size="sm" /> : <ArrowForwardIcon />}
              onClick={handleSendMessage}
              isDisabled={isLoading || !inputValue.trim()}
              colorScheme="purple"
              size="sm"
              borderRadius="md"
              aria-label="Send"
            />
          </Tooltip>
        </HStack>
      </Box>
    </Box>
  );
};

export default AIAssistantChat;
