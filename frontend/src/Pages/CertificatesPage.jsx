import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Grid,
  Text,
  VStack,
  Center,
  Spinner,
  useToast,
  Heading,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import Navbar from "../components/UserComponents/UserNavbar";
import Footer from "./Footer";
import { API_BASE_URL } from "../config/api";

function getAuthHeaders() {
  try {
    const raw = localStorage.getItem("user");
    const token = JSON.parse(raw)?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

const CertificatesPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/certificate/list`, {
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });
      const data = await res.json();
      setCertificates(data.certificates || []);
    } catch {
      toast({ title: "Error loading certificates", status: "error", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async (cert) => {
    try {
      const div = document.createElement("div");
      div.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:800px;padding:40px;background:white;font-family:serif;";
      div.innerHTML = getCertificateHTML(cert);
      document.body.appendChild(div);
      await new Promise((r) => setTimeout(r, 500));

      const canvas = await html2canvas(div, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      document.body.removeChild(div);

      const link = document.createElement("a");
      link.download = `certificate-${cert.certificateNumber}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast({
        title: "Certificate downloaded!",
        status: "success",
        duration: 3000,
      });
    } catch (err) {
      toast({ title: "Download failed", status: "error", duration: 3000 });
    }
  };

  const getCertificateHTML = (cert) => `
    <div style="width:720px;height:520px;border:8px solid #DAA520;padding:30px;text-align:center;position:relative;background:#fff;box-sizing:border-box;">
      <div style="border:3px solid #DAA520;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;box-sizing:border-box;">
        <div style="font-size:50px;margin-bottom:10px;">🎓</div>
        <h1 style="font-size:32px;color:#8B4513;margin:5px 0;text-transform:uppercase;letter-spacing:3px;font-weight:bold;">Certificate of Completion</h1>
        <p style="font-size:16px;color:#666;margin:5px 0;">This is to certify that</p>
        <h2 style="font-size:28px;color:#2c3e50;margin:8px 0;font-weight:bold;">${cert.studentName}</h2>
        <p style="font-size:16px;color:#666;margin:5px 0;">has successfully completed the course</p>
        <h3 style="font-size:22px;color:#8B4513;margin:8px 0;font-style:italic;">"${cert.courseName}"</h3>
        <p style="font-size:14px;color:#888;margin:15px 0;">Date Issued: ${new Date(cert.issuedDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        <div style="margin-top:15px;border-top:1px solid #ddd;padding-top:10px;width:300px;">
          <p style="font-size:11px;color:#999;font-family:monospace;">Certificate ID: ${cert.certificateId}</p>
          <p style="font-size:11px;color:#999;font-family:monospace;">#${cert.certificateNumber}</p>
        </div>
      </div>
    </div>
  `;

  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Box maxW="1200px" mx="auto" p={6} pt="100px">
        <Heading size="lg" mb={6}>
          🎓 My Certifications
        </Heading>

        {loading ? (
          <Center h="300px">
            <Spinner size="lg" color="purple.500" />
          </Center>
        ) : certificates.length === 0 ? (
          <Center h="300px" flexDir="column" gap={4}>
            <Text fontSize="4xl">📜</Text>
            <Text fontSize="lg" fontWeight="semibold">
              No Certifications Yet
            </Text>
            <Text color="gray.600" textAlign="center" maxW="400px">
              Complete quizzes in a course with at least 80% pass rate to earn
              a certificate.
            </Text>
            <Button colorScheme="purple" onClick={() => navigate("/home")}>
              Browse Courses
            </Button>
          </Center>
        ) : (
          <Grid
            templateColumns={{
              base: "1fr",
              md: "repeat(2,1fr)",
              lg: "repeat(3,1fr)",
            }}
            gap={6}
          >
            {certificates.map((cert) => (
              <Box
                key={cert._id}
                borderWidth="2px"
                borderColor="gold"
                borderRadius="lg"
                p={5}
                bg="white"
                _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <VStack align="center" spacing={3}>
                  <Text fontSize="3xl">🎓</Text>
                  <Text fontWeight="bold" textAlign="center" fontSize="md">
                    {cert.courseName}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {cert.studentName}
                  </Text>
                  <Box bg="gold" w="full" h="1px" />
                  <Text fontSize="xs" color="gray.400">
                    {new Date(cert.issuedDate).toLocaleDateString()}
                  </Text>
                  <Text fontSize="xs" color="gray.400" fontFamily="mono">
                    #{cert.certificateNumber?.slice(-8)}
                  </Text>
                  <Button
                    size="sm"
                    colorScheme="yellow"
                    onClick={() => downloadImage(cert)}
                  >
                    🖼️ Download Image
                  </Button>
                </VStack>
              </Box>
            ))}
          </Grid>
        )}
      </Box>
      <Footer />
    </Box>
  );
};

export default CertificatesPage;