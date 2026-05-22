import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  Spinner,
  Text,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../components/UserComponents/UserNavbar";
import Footer from "./Footer";
import Payment from "./Payment/Payment";
import { API_BASE_URL } from "../config/api";
import { showToast } from "../components/SignUp";

function snippet(text, max = 220) {
  if (!text || typeof text !== "string") return "";
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export default function CourseEnrollPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const token = useSelector((s) => s.UserReducer?.token);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [phase, setPhase] = useState("loading");
  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setPhase("loading");
    setEnrolled(false);
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    };
    try {
      const [enrollRes, courseRes] = await Promise.all([
        fetch(`${API_BASE_URL}/users/enrollment/${id}`, { headers }),
        fetch(`${API_BASE_URL}/courses/${id}`, { headers }),
      ]);
      const enrollJson = await enrollRes.json().catch(() => ({}));
      const courseJson = await courseRes.json().catch(() => ({}));

      if (!enrollRes.ok) {
        setPhase("error");
        setCourse(courseJson.course || null);
        return;
      }
      setEnrolled(!!enrollJson.enrolled);
      if (courseJson.course) {
        setCourse(courseJson.course);
      } else {
        setCourse(null);
      }
      setPhase("ready");
    } catch {
      setPhase("error");
    }
  }, [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleJoinFree = async () => {
    if (!id || !token) return;
    setJoining(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      };
      const res = await fetch(`${API_BASE_URL}/users/addCourse/${id}`, {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast({
          toast,
          message: data.error || data.message || "Could not enroll",
          color: "red",
        });
        return;
      }
      showToast({
        toast,
        message: data.message || data.msg || "Enrolled successfully",
        color: "green",
      });
      navigate(`/course/${id}/learn`, { replace: true });
    } catch (e) {
      showToast({ toast, message: e?.message || "Request failed", color: "red" });
    } finally {
      setJoining(false);
    }
  };

  const priceNum = Number(course?.price);
  const isFree =
    course && (!Number.isFinite(priceNum) || priceNum <= 0);
  const canEnroll = !!course && phase === "ready";

  if (!id) {
    return <Navigate to="/" replace />;
  }

  if (phase === "loading") {
    return (
      <Box>
        <Navbar />
        <Flex minH="50vh" align="center" justify="center">
          <Spinner size="xl" color="purple.500" />
        </Flex>
        <Footer />
      </Box>
    );
  }

  if (enrolled) {
    return <Navigate to={`/course/${id}/learn`} replace />;
  }

  return (
    <Box pb="2rem">
      <Navbar />
      <Box maxW="720px" mx="auto" px={4} pt="100px">
        <VStack align="stretch" spacing={6}>
          <Heading size="lg">Enroll in course</Heading>

          {phase === "error" && !course ? (
            <Text color="red.500">We could not load this course. Try again later.</Text>
          ) : !canEnroll ? (
            <Text color="gray.600">
              Course details are unavailable. You can still open the course page or try again
              later.
            </Text>
          ) : (
            <>
              <Flex
                direction={{ base: "column", sm: "row" }}
                gap={6}
                borderWidth="1px"
                borderRadius="md"
                p={6}
                bg="gray.50"
              >
                {course?.img ? (
                  <Image
                    src={course.img}
                    alt={course.title || "Course"}
                    maxW={{ base: "100%", sm: "200px" }}
                    borderRadius="md"
                    objectFit="cover"
                  />
                ) : null}
                <Box flex="1">
                  <Heading size="md" mb={2}>
                    {course?.title || "Course"}
                  </Heading>
                  <Text fontWeight="bold" color="purple.600" mb={2}>
                    {isFree ? "Free" : `₹${course?.price}`}
                  </Text>
                  <Text color="gray.700" fontSize="sm">
                    {snippet(course?.description) || "No description available."}
                  </Text>
                </Box>
              </Flex>

              {isFree ? (
                <Button
                  colorScheme="purple"
                  size="lg"
                  onClick={handleJoinFree}
                  isLoading={joining}
                  loadingText="Joining"
                  isDisabled={!canEnroll}
                >
                  Join free
                </Button>
              ) : (
                <Button colorScheme="purple" size="lg" onClick={onOpen} isDisabled={!canEnroll}>
                  Purchase
                </Button>
              )}
            </>
          )}
        </VStack>
      </Box>
      <Payment
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={onClose}
        onPurchaseSuccess={() => navigate(`/course/${id}/learn`, { replace: true })}
      />
      <Footer />
    </Box>
  );
}
