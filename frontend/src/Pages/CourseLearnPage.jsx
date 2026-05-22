import React, { useEffect, useState } from "react";
import {
  AspectRatio,
  Box,
  Flex,
  Heading,
  Image,
  Spinner,
  Text,
  VStack,
  Button,
  Divider,
  Radio,
  RadioGroup,
  Stack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import ReactPlayer from "react-player";
import Navbar from "../components/UserComponents/UserNavbar";
import Footer from "./Footer";
import AIAssistantChat from "../components/AIAssistantChat";
import ChatWidget from "../components/ChatWidget";
import { API_BASE_URL } from "../config/api";

export default function CourseLearnPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const token = useSelector((s) => s.UserReducer?.token);
  const isAuth = useSelector((s) => s.UserReducer?.isAuth);

  const [phase, setPhase] = useState("loading"); // loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");
  const [course, setCourse] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  /** `null` = no quiz or failed load; object = quiz payload (no correct answers). */
  const [practiceQuiz, setPracticeQuiz] = useState(null);
  /** `none` = 404 / empty; `error` = non-404 failure */
  const [quizAvailability, setQuizAvailability] = useState("none");
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  // Certificate state
  const [certInfo, setCertInfo] = useState(null);
  const [certLoading, setCertLoading] = useState(false);
  const [certIssuing, setCertIssuing] = useState(false);

  // Fetch certificate eligibility when course is ready
  useEffect(() => {
    if (phase !== "ready" || !token || !id) return;
    let cancelled = false;

    async function checkCert() {
      setCertLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/certificate/check/${id}`,
          {
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (!cancelled) {
          setCertInfo(data);
        }
      } catch {
        if (!cancelled) setCertInfo(null);
      } finally {
        if (!cancelled) setCertLoading(false);
      }
    }

    checkCert();
    return () => { cancelled = true; };
  }, [phase, token, id]);

  async function handleIssueCertificate() {
    if (!token || !id) return;
    setCertIssuing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/certificate/issue/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "🎉 Certificate Issued!",
          description: "You have earned a certificate for this course!",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        // Refresh cert info
        setCertInfo((prev) => ({
          ...prev,
          hasCertificate: true,
          certificate: data.certificate,
        }));
        // Navigate to certificates page
        setTimeout(() => navigate("/certificates"), 2000);
      } else {
        toast({
          title: "Certificate Error",
          description: data.message || "Could not issue certificate.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch {
      toast({
        title: "Network Error",
        description: "Could not issue certificate. Try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCertIssuing(false);
    }
  }
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      if (!token || !isAuth) {
        const next = encodeURIComponent(`/course/${id}/learn`);
        navigate(`/login?next=${next}`, { replace: true });
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      };

      setPhase("loading");
      setErrorMessage("");

      try {
        const enrollRes = await fetch(
          `${API_BASE_URL}/users/enrollment/${id}`,
          { headers }
        );
        const enrollJson = await enrollRes.json().catch(() => ({}));
        if (cancelled) return;

        if (!enrollRes.ok) {
          setPhase("error");
          setErrorMessage(
            enrollJson.message || "Could not verify enrollment. Try again."
          );
          return;
        }

        if (!enrollJson.enrolled) {
          navigate(`/course/${id}/enroll`, { replace: true });
          return;
        }

        const vdoRes = await fetch(
          `${API_BASE_URL}/videos/courseVideos/${id}`,
          { method: "GET", headers }
        );
        const vdoJson = await vdoRes.json().catch(() => ({}));
        if (cancelled) return;

        if (vdoRes.status === 403) {
          navigate(`/course/${id}/enroll`, { replace: true });
          return;
        }

        if (!vdoRes.ok) {
          setPhase("error");
          setErrorMessage(vdoJson.message || "Failed to load course videos.");
          return;
        }

        setCourse(vdoJson.course || null);
        setActiveIndex(0);
        setQuizResult(null);
        setQuizAnswers({});

        setPhase("ready");
      } catch (e) {
        if (!cancelled) {
          setPhase("error");
          setErrorMessage("Something went wrong loading this course.");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, token, isAuth, navigate]);

  const videos = course?.videos || [];
  const activeVideo = videos[activeIndex];
  const activeVideoId =
    activeVideo && activeVideo._id != null
      ? String(activeVideo._id)
      : null;

  useEffect(() => {
    if (phase !== "ready" || !token || !activeVideoId) {
      return;
    }
    let cancelled = false;

    async function loadQuizForVideo() {
      setQuizLoading(true);
      setQuizResult(null);
      setQuizAnswers({});
      setPracticeQuiz(null);
      setQuizAvailability("none");

      const headers = {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      };

      try {
        const quizRes = await fetch(
          `${API_BASE_URL}/quizzes/video/${activeVideoId}`,
          { method: "GET", headers }
        );
        const quizJson = await quizRes.json().catch(() => ({}));
        if (cancelled) return;

        if (quizRes.status === 403) {
          navigate(`/course/${id}/enroll`, { replace: true });
          return;
        }

        if (quizRes.ok && quizJson.quiz) {
          setPracticeQuiz(quizJson.quiz);
          setQuizAvailability("ok");
        } else {
          setPracticeQuiz(null);
          setQuizAvailability(
            quizRes.status === 404 ? "none" : "error"
          );
        }
      } catch {
        if (!cancelled) {
          setPracticeQuiz(null);
          setQuizAvailability("error");
        }
      } finally {
        if (!cancelled) {
          setQuizLoading(false);
        }
      }
    }

    loadQuizForVideo();
    return () => {
      cancelled = true;
    };
  }, [phase, token, activeVideoId, id, navigate]);

  if (!isAuth) {
    const next = encodeURIComponent(`/course/${id}/learn`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  const quizQuestionCount = practiceQuiz?.questions?.length || 0;
  const allQuizAnswered =
    quizQuestionCount > 0 &&
    practiceQuiz.questions.every(
      (_, idx) => quizAnswers[idx] !== undefined && quizAnswers[idx] !== null
    );

  async function handleQuizSubmit() {
    if (!practiceQuiz || !activeVideoId || !token || !allQuizAnswered) return;
    const answers = practiceQuiz.questions.map((_, idx) => quizAnswers[idx]);
    setQuizSubmitting(true);
    setQuizResult(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/quizzes/video/${activeVideoId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ answers }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const correct =
          data.score !== undefined
            ? data.score
            : data.correctCount;
        const total =
          data.total !== undefined
            ? data.total
            : data.totalQuestions;
        const percent =
          data.percent !== undefined && data.percent !== null
            ? data.percent
            : typeof correct === "number" &&
                typeof total === "number" &&
                total > 0
              ? Math.round((correct / total) * 100)
              : total === 0
                ? 0
                : undefined;
        setQuizResult({
          correctCount: correct,
          totalQuestions: total,
          percent,
        });
        if (percent !== undefined && total != null) {
          toast({
            title: "Quiz submitted",
            description: `${correct} of ${total} correct (${percent}%).`,
            status: "success",
            duration: 5000,
            isClosable: true,
          });
        }
      } else {
        setQuizResult({
          error: data.message || "Could not submit quiz.",
        });
      }
    } catch {
      setQuizResult({ error: "Network error submitting quiz." });
    } finally {
      setQuizSubmitting(false);
    }
  }


  return (
    <Box minH="100vh" bg="gray.100">
      <Navbar />
      <Box pt="80px" px={{ base: 3, md: 6 }} pb={10} maxW="1400px" mx="auto">
        {phase === "loading" && (
          <Flex justify="center" align="center" minH="40vh" gap={3}>
            <Spinner size="lg" color="purple.500" />
            <Text color="gray.600">Loading course…</Text>
          </Flex>
        )}

        {phase === "error" && (
          <Box
            bg="white"
            p={8}
            borderRadius="md"
            boxShadow="sm"
            textAlign="center"
          >
            <Text fontWeight="bold" mb={2}>
              {errorMessage}
            </Text>
            <Button
              colorScheme="purple"
              mt={4}
              onClick={() => navigate(`/course/${id}`)}
            >
              Back to course overview
            </Button>
          </Box>
        )}

        {phase === "ready" && course && (
          <>
            <Heading size="lg" mb={4} color="gray.800">
              {course.title}
            </Heading>
            <Flex
              gap={4}
              align="stretch"
              direction={{ base: "column", lg: "row" }}
            >
              <Box
                flex="1"
                minW={0}
                bg="black"
                borderRadius="md"
                overflow="hidden"
                boxShadow="md"
              >
                {activeVideo?.link ? (
                  <AspectRatio ratio={16 / 9} maxW="100%">
                    <ReactPlayer
                      url={activeVideo.link}
                      width="100%"
                      height="100%"
                      controls
                      playing={false}
                      config={{
                        youtube: { playerVars: { modestbranding: 1 } },
                      }}
                    />
                  </AspectRatio>
                ) : (
                  <Flex
                    minH={{ base: "220px", md: "400px" }}
                    align="center"
                    justify="center"
                    bg="gray.900"
                  >
                    <Text color="gray.300">
                      Select a lesson or add a video link for this course.
                    </Text>
                  </Flex>
                )}
              </Box>

              <Box
                w={{ base: "100%", lg: "360px" }}
                flexShrink={0}
                bg="white"
                borderRadius="md"
                boxShadow="md"
                display="flex"
                flexDirection="column"
                h={{ lg: "70vh" }}
              >
                <Tabs
                  display="flex"
                  flexDirection="column"
                  flex="1"
                  minH={0}
                  colorScheme="purple"
                >
                    <TabList
                      borderBottom="1px solid"
                      borderColor="gray.200"
                      px={0}
                    >
                      <Tab flex={1} py={3} fontSize="sm" fontWeight="600">
                        Course Content
                      </Tab>
                      <Tab flex={1} py={3} fontSize="sm" fontWeight="600">
                        AI Assistant
                      </Tab>
                      <Tab flex={1} py={3} fontSize="sm" fontWeight="600">
                        💬 Chat
                      </Tab>
                    </TabList>

                  <TabPanels
                    flex="1"
                    minH={0}
                    p={0}
                    display="flex"
                    flexDirection="column"
                  >
                    <TabPanel
                      h="100%"
                      p={0}
                      overflowY="auto"
                      display="flex"
                      flexDirection="column"
                    >
                      {videos.length === 0 ? (
                        <Box p={4}>
                          <Text color="gray.600" fontSize="sm">
                            No videos are published for this course yet.
                          </Text>
                        </Box>
                      ) : (
                        <VStack align="stretch" spacing={0} divider={<Divider />}>
                          {videos.map((v, idx) => (
                            <Button
                              key={v._id || idx}
                              variant="ghost"
                              justifyContent="flex-start"
                              h="auto"
                              py={3}
                              px={3}
                              borderRadius={0}
                              bg={idx === activeIndex ? "purple.50" : "transparent"}
                              _hover={{ bg: "purple.100" }}
                              onClick={() => setActiveIndex(idx)}
                            >
                              <Flex gap={3} w="100%" textAlign="left">
                                <Image
                                  src={v.img}
                                  alt=""
                                  boxSize="56px"
                                  objectFit="cover"
                                  borderRadius="sm"
                                  flexShrink={0}
                                />
                                <Box minW={0}>
                                  <Text
                                    fontWeight="semibold"
                                    fontSize="sm"
                                    noOfLines={2}
                                    color="gray.800"
                                  >
                                    {v.title}
                                  </Text>
                                  {v.description ? (
                                    <Text
                                      fontSize="xs"
                                      color="gray.500"
                                      noOfLines={2}
                                    >
                                      {v.description}
                                    </Text>
                                  ) : null}
                                </Box>
                              </Flex>
                            </Button>
                          ))}
                        </VStack>
                      )}
                    </TabPanel>

                      <TabPanel
                        h="100%"
                        p={0}
                        display="flex"
                        flexDirection="column"
                      >
                        <AIAssistantChat
                          courseId={id}
                          token={token}
                          containerHeight="100%"
                        />
                      </TabPanel>
                      <TabPanel
                        h="100%"
                        p={0}
                        display="flex"
                        flexDirection="column"
                      >
                        <ChatWidget
                          courseId={id}
                          token={token}
                        />
                      </TabPanel>
                    </TabPanels>
                </Tabs>
              </Box>
            </Flex>

            {activeVideo && (
              <Box mt={6} bg="white" p={5} borderRadius="md" boxShadow="sm">
                <Heading size="md" mb={2}>
                  {activeVideo.title}
                </Heading>
                {activeVideo.description ? (
                  <Text color="gray.700">{activeVideo.description}</Text>
                ) : null}
              </Box>
            )}

            <Box mt={6} bg="white" p={5} borderRadius="md" boxShadow="sm">
              <Heading size="md" mb={3} color="gray.800">
                Lesson quiz
              </Heading>
              {quizLoading ? (
                <Flex align="center" gap={2}>
                  <Spinner size="sm" color="purple.500" />
                  <Text color="gray.600" fontSize="sm">
                    Loading quiz for this lesson…
                  </Text>
                </Flex>
              ) : !practiceQuiz ? (
                <Text color="gray.600" fontSize="sm">
                  {quizAvailability === "error"
                    ? "We could not load the quiz for this lesson. Try refreshing the page."
                    : "No quiz for this lesson."}
                </Text>
              ) : (
                <VStack align="stretch" spacing={5}>
                  <Text fontSize="sm" color="gray.600">
                    {practiceQuiz.title}
                  </Text>
                  {practiceQuiz.questions.map((q, qIdx) => (
                    <Box key={qIdx}>
                      <Text fontWeight="semibold" mb={2} color="gray.800">
                        {qIdx + 1}. {q.prompt}
                      </Text>
                      <RadioGroup
                        value={
                          quizAnswers[qIdx] !== undefined &&
                          quizAnswers[qIdx] !== null
                            ? String(quizAnswers[qIdx])
                            : ""
                        }
                        onChange={(val) =>
                          setQuizAnswers((prev) => ({
                            ...prev,
                            [qIdx]: Number(val),
                          }))
                        }
                      >
                        <Stack spacing={2} pl={1}>
                          {q.choices.map((choice, cIdx) => (
                            <Radio key={cIdx} value={String(cIdx)} colorScheme="purple">
                              {choice}
                            </Radio>
                          ))}
                        </Stack>
                      </RadioGroup>
                    </Box>
                  ))}
                  <Button
                    colorScheme="purple"
                    alignSelf="flex-start"
                    isLoading={quizSubmitting}
                    isDisabled={!allQuizAnswered}
                    onClick={handleQuizSubmit}
                  >
                    Submit answers
                  </Button>
                  {quizResult?.error ? (
                    <Alert status="error" borderRadius="md">
                      <AlertIcon />
                      <Box>
                        <AlertTitle fontSize="sm">Submit failed</AlertTitle>
                        <AlertDescription fontSize="sm">
                          {quizResult.error}
                        </AlertDescription>
                      </Box>
                    </Alert>
                  ) : null}
                  {quizResult &&
                  quizResult.percent !== undefined &&
                  !quizResult.error ? (
                    <Alert status="success" borderRadius="md">
                      <AlertIcon />
                      <Box>
                        <AlertTitle fontSize="sm">Results</AlertTitle>
                        <AlertDescription fontSize="sm">
                          {quizResult.correctCount} of{" "}
                          {quizResult.totalQuestions} correct (
                          {quizResult.percent}%). You can submit again to record
                          another attempt.
                        </AlertDescription>
                      </Box>
                    </Alert>
                  ) : null}
                </VStack>
              )}
            </Box>

            {/* Certificate Section */}
            <Box mt={6} bg="white" p={5} borderRadius="md" boxShadow="sm">
              <Heading size="md" mb={3} color="gray.800">
                🎓 Course Certificate
              </Heading>
              {certLoading ? (
                <Flex align="center" gap={2}>
                  <Spinner size="sm" color="purple.500" />
                  <Text color="gray.600" fontSize="sm">
                    Checking certificate eligibility…
                  </Text>
                </Flex>
              ) : certInfo?.hasCertificate ? (
                <Box>
                  <Alert status="success" borderRadius="md" mb={3}>
                    <AlertIcon />
                    <Box>
                      <AlertTitle fontSize="sm">Certificate Earned! 🎉</AlertTitle>
                      <AlertDescription fontSize="sm">
                        You have earned a certificate for this course.
                      </AlertDescription>
                    </Box>
                  </Alert>
                  <Button
                    colorScheme="yellow"
                    onClick={() => navigate("/certificates")}
                    leftIcon={<Text as="span">🎓</Text>}
                  >
                    View My Certificate
                  </Button>
                </Box>
              ) : (
                <Box>
                  {!certInfo?.isEnrolled ? (
                    <Text color="gray.600" fontSize="sm">
                      Enroll in this course and complete all quizzes with at least 80% to earn a certificate.
                    </Text>
                  ) : (
                    <>
                      <Text color="gray.600" fontSize="sm" mb={3}>
                        Complete all lesson quizzes with an average score of <strong>80%</strong> or higher to earn your certificate.
                      </Text>
                      {certInfo && (
                        <Box mb={3} p={3} bg="gray.50" borderRadius="md">
                          <Flex justify="space-between" wrap="wrap" gap={2}>
                            <Box>
                              <Text fontSize="sm" color="gray.600">
                                Videos completed:{" "}
                                <strong>
                                  {certInfo.videosCompleted || 0}/{certInfo.totalVideos || 0}
                                </strong>
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="sm" color="gray.600">
                                Average score:{" "}
                                <strong
                                  style={{
                                    color:
                                      (certInfo.averageScore || 0) >= 80
                                        ? "green"
                                        : "orange",
                                  }}
                                >
                                  {certInfo.averageScore || 0}%
                                </strong>
                              </Text>
                            </Box>
                          </Flex>
                        </Box>
                      )}
                      {certInfo?.eligible ? (
                        <Button
                          colorScheme="green"
                          size="lg"
                          leftIcon={<Text as="span">🎓</Text>}
                          isLoading={certIssuing}
                          onClick={handleIssueCertificate}
                        >
                          Get My Certificate
                        </Button>
                      ) : (
                        <Text color="gray.500" fontSize="sm" fontStyle="italic">
                          {!certInfo || certInfo.videosCompleted === 0
                            ? "Complete the quizzes above to track your progress."
                            : certInfo.videosCompleted < certInfo.totalVideos
                            ? `Complete quizzes for all ${certInfo.totalVideos} lessons to become eligible.`
                            : (certInfo.averageScore || 0) < 80
                            ? `Your average score is ${certInfo.averageScore}%. Re-take quizzes to improve your score to 80% or higher.`
                            : "Check your eligibility by refreshing the page."}
                        </Text>
                      )}
                    </>
                  )}
                </Box>
              )}
            </Box>
          </>
        )}
      </Box>
      <Footer />
    </Box>
  );
}