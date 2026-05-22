import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  HStack,
  Text,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { AttachmentIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const AdminUploadPDFContext = ({ courseId, token }) => {
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const toast = useToast();

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Lỗi',
        description: 'Chỉ chấp nhận file PDF',
        status: 'error',
        duration: 3,
        isClosable: true,
      });
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: 'Lỗi',
        description: 'File PDF không được vượt quá 15MB',
        status: 'error',
        duration: 3,
        isClosable: true,
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'Cảnh báo',
        description: 'Vui lòng chọn file PDF',
        status: 'warning',
        duration: 3,
        isClosable: true,
      });
      return;
    }

    if (!courseId) {
      toast({
        title: 'Lỗi',
        description: 'Thiếu courseId',
        status: 'error',
        duration: 3,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('courseId', courseId);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/ai-assistant/upload-pdf`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      toast({
        title: 'Thành công',
        description: response.data.message || 'Tài liệu đã được tải lên thành công',
        status: 'success',
        duration: 3,
        isClosable: true,
      });

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Lỗi khi tải file';
      toast({
        title: 'Lỗi',
        description: errorMsg,
        status: 'error',
        duration: 3,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <HStack spacing={3} w="100%">
        <Button
          leftIcon={<AttachmentIcon />}
          onClick={() => fileInputRef.current?.click()}
          colorScheme="purple"
          variant="outline"
          isDisabled={isLoading}
          w="100%"
        >
          {isLoading ? 'Đang xử lý...' : selectedFile ? `${selectedFile.name}` : 'Tải tài liệu khóa học (PDF)'}
        </Button>

        {selectedFile && (
          <Button
            onClick={handleUpload}
            colorScheme="purple"
            isLoading={isLoading}
            spinnerPlacement="start"
            loadingText="Đang tải"
          >
            Tải lên
          </Button>
        )}
      </HStack>

      {selectedFile && (
        <Text fontSize="xs" color="gray.600" mt={2}>
          File: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
        </Text>
      )}
    </Box>
  );
};

export default AdminUploadPDFContext;
