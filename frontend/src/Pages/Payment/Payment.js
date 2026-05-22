import { Button } from "@chakra-ui/button";
import { useDisclosure } from "@chakra-ui/hooks";
import { Box, Flex, Heading, Text } from "@chakra-ui/layout";
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/modal";
import { keyframes, useToast, Spinner, Image } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router";
import { showToast } from "../../components/SignUp";
import { API_BASE_URL } from "../../config/api";
import { QRCodeCanvas } from "qrcode.react";

export default function Payment({ isOpen, onOpen, onClose, onPurchaseSuccess }) {
  const { id } = useParams();
  const courseId = id;
  const toast = useToast();
  const token = JSON.parse(localStorage.getItem("user"))?.token || "";

  const [course, setCourse] = useState({});
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [payUrl, setPayUrl] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    if (!courseId) return;
    const fetchCourse = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourse(res.data.course);
      } catch (err) {
        console.log(err);
      }
    };
    fetchCourse();
  }, [courseId, token]);

  // Create MoMo payment request
  const handleCreatePayment = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/payment/momo/create`,
        { courseId, amount: course?.price },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.payUrl) {
        setPayUrl(res.data.payUrl);
        setQrCodeUrl(res.data.qrCodeUrl);
      }
    } catch (err) {
      console.error("MoMo create error:", err);
      showToast({
        toast,
        message: "Không thể tạo thanh toán MoMo. Vui lòng thử lại!",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Simulate successful payment (for demo/testing)
  const handleSimulateSuccess = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/payment/momo/simulate`,
        { courseId, amount: course?.price },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast({
        toast,
        message: res?.data?.message || "Thanh toán thành công!",
        color: "green",
      });

      setPaymentSuccess(true);

      if (typeof onPurchaseSuccess === "function") {
        onPurchaseSuccess();
      }

      // Auto close after 2 seconds
      setTimeout(() => {
        onClose();
        setPaymentSuccess(false);
        setPayUrl("");
        setQrCodeUrl("");
      }, 2000);
    } catch (err) {
      console.error("MoMo simulate error:", err);
      showToast({
        toast,
        message: err?.response?.data?.error || err?.message || "Thanh toán thất bại!",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPayUrl("");
    setQrCodeUrl("");
    setPaymentSuccess(false);
    onClose();
  };

  // Generate MoMo QR code data for offline scanning
  const momoQRData = `2|99|${course?.price || 0}|Thanh toan khoa hoc|${courseId}`;

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize="xl" fontWeight="bold" textAlign="center">
            {paymentSuccess ? "🎉 Thanh toán thành công!" : "Thanh toán qua MoMo"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {paymentSuccess ? (
              <Box textAlign="center" py={6}>
                <Text fontSize="lg" color="green.500" fontWeight="bold">
                  Bạn đã đăng ký khóa học thành công!
                </Text>
                <Text mt={2} color="gray.600">
                  Chúc bạn học tập vui vẻ 🎓
                </Text>
              </Box>
            ) : (
              <Box>
                {/* Course Info */}
                <Box mb={4} p={3} bg="gray.50" borderRadius="md">
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Text fontWeight="bold" fontSize="md">
                        {course?.title || "Khóa học"}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Giảng viên: {course?.teacher || "N/A"}
                      </Text>
                    </Box>
                    <Box textAlign="right">
                      <Text fontWeight="bold" fontSize="xl" color="red.500">
                        {course?.price?.toLocaleString()}₫
                      </Text>
                    </Box>
                  </Flex>
                </Box>

                {/* MoMo Payment Section */}
                <Box textAlign="center" py={4}>
                  <Heading size="md" mb={4}>
                    Quét mã QR để thanh toán
                  </Heading>

                  {/* QR Code */}
                  <Box
                    p={4}
                    bg="white"
                    borderRadius="lg"
                    border="2px solid"
                    borderColor="gray.200"
                    display="inline-block"
                    mb={4}
                  >
                    {payUrl ? (
                      <QRCodeCanvas value={payUrl} size={200} />
                    ) : (
                      <QRCodeCanvas value={momoQRData} size={200} />
                    )}
                  </Box>

                  <Text fontSize="sm" color="gray.500" mb={4}>
                    Sử dụng ứng dụng MoMo để quét mã QR
                  </Text>

                  {/* Payment URL Link */}
                  {payUrl && (
                    <Box mb={4}>
                      <Text fontSize="sm" color="blue.500" mb={2}>
                        Hoặc click vào link dưới đây để thanh toán:
                      </Text>
                      <Button
                        as="a"
                        href={payUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        colorScheme="blue"
                        size="sm"
                        variant="outline"
                      >
                        Mở MoMo App
                      </Button>
                    </Box>
                  )}

                  {/* Create Payment Button */}
                  {!payUrl && (
                    <Button
                      colorScheme="pink"
                      onClick={handleCreatePayment}
                      isLoading={loading}
                      loadingText="Đang tạo..."
                      w="full"
                      mb={3}
                      size="lg"
                      leftIcon={
                        <Box as="span" fontWeight="bold">
                          MoMo
                        </Box>
                      }
                    >
                      Tạo mã thanh toán MoMo
                    </Button>
                  )}

                  {/* Simulate Success Button (for demo) */}
                  <Button
                    colorScheme="green"
                    onClick={handleSimulateSuccess}
                    isLoading={loading && payUrl !== ""}
                    loadingText="Đang xử lý..."
                    w="full"
                    variant="outline"
                    size="md"
                  >
                    ✅ Thanh toán thành công (Demo)
                  </Button>

                  <Text fontSize="xs" color="gray.400" mt={2}>
                    * Nút "Thanh toán thành công" dùng để mô phỏng thanh toán thành công trong môi trường demo
                  </Text>
                </Box>

                {/* MoMo Logo */}
                <Flex justify="center" align="center" mt={2} gap={2}>
                  <Text fontSize="sm" color="gray.400">
                    Powered by
                  </Text>
                  <Text fontWeight="bold" color="pink.500" fontSize="md">
                    MoMo
                  </Text>
                </Flex>
              </Box>
            )}
          </ModalBody>

          <ModalFooter>
            <Button
              colorScheme="gray"
              mr={3}
              onClick={handleClose}
              isDisabled={loading}
            >
              {paymentSuccess ? "Đóng" : "Hủy"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}