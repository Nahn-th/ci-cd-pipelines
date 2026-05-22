import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  Text,
  Textarea,
  useToast,
  VStack,
} from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import TeacherNavTop from "./TeacherNavTop";
import { API_BASE_URL } from "../../config/api";

const emptyQuestion = () => ({
  prompt: "",
  choicesText: "Option A\nOption B\nOption C\nOption D",
  correctIndex: 0,
});

function dedupeVideosById(list) {
  if (!Array.isArray(list)) return [];
  const byId = new Map();
  for (const v of list) {
    if (!v?._id) continue;
    const id = String(v._id);
    if (!/^[a-fA-F0-9]{24}$/.test(id)) continue;
    if (!byId.has(id)) byId.set(id, v);
  }
  return [...byId.values()];
}

export default function TeacherCreateQuiz() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const token = useSelector((s) => s.UserReducer?.token);

  const [title, setTitle] = useState("Lesson quiz");
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState("");

  const validCourseId = useMemo(
    () => Boolean(courseId && /^[a-fA-F0-9]{24}$/.test(courseId)),
    [courseId]
  );

  useEffect(() => {
    if (!validCourseId || !token) {
      setVideos([]);
      setSelectedVideoId("");
      return;
    }
    let cancelled = false;

    async function loadVideos() {
      setVideosLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/videos/courseVideos/${courseId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setVideos([]);
          setSelectedVideoId("");
          toast({
            title: "Could not load lessons",
            description: data.message || res.statusText,
            status: "error",
          });
          return;
        }
        const list = data.course?.videos || [];
        setVideos(dedupeVideosById(list));
        setSelectedVideoId("");
      } catch {
        if (!cancelled) {
          setVideos([]);
          setSelectedVideoId("");
          toast({ title: "Network error loading lessons", status: "error" });
        }
      } finally {
        if (!cancelled) {
          setVideosLoading(false);
        }
      }
    }

    loadVideos();
    return () => {
      cancelled = true;
    };
  }, [validCourseId, courseId, token]);

  function updateQuestion(idx, patch) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    );
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  }

  function removeQuestion(idx) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!token) {
      toast({ title: "Not signed in", status: "error" });
      return;
    }
    if (!validCourseId) {
      toast({ title: "Invalid course id in URL", status: "error" });
      return;
    }
    if (!selectedVideoId) {
      toast({
        title: "Choose a lesson",
        description: "Select the video this quiz belongs to.",
        status: "warning",
      });
      return;
    }
    const vidStr = String(selectedVideoId).trim();
    if (!videos.some((v) => String(v._id) === vidStr)) {
      toast({
        title: "Invalid lesson",
        description: "Please pick a lesson from the list again.",
        status: "warning",
      });
      return;
    }

    const payloadQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const prompt = (q.prompt || "").trim();
      const choices = (q.choicesText || "")
        .split("\n")
        .map((c) => c.trim())
        .filter(Boolean);
      if (!prompt) {
        toast({
          title: `Question ${i + 1} needs a prompt`,
          status: "warning",
        });
        return;
      }
      if (choices.length < 2) {
        toast({
          title: `Question ${i + 1}: add at least two choices (one per line)`,
          status: "warning",
        });
        return;
      }
      const ci = Number(q.correctIndex);
      if (!Number.isInteger(ci) || ci < 0 || ci >= choices.length) {
        toast({
          title: `Question ${i + 1}: correct answer must match a choice line`,
          status: "warning",
        });
        return;
      }
      payloadQuestions.push({
        prompt,
        choices,
        correctIndex: ci,
      });
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/quizzes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          videoId: vidStr,
          title: title.trim() || "Lesson quiz",
          questions: payloadQuestions,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: "Could not save quiz",
          description: data.message || res.statusText,
          status: "error",
        });
        return;
      }
      toast({
        title: res.status === 201 ? "Quiz created" : "Quiz updated",
        description: "Learners will see it on the course learn page for that lesson.",
        status: "success",
      });
      navigate("/Teacher/courses");
    } catch {
      toast({ title: "Network error", status: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Grid className="Nav" h="99vh" w="94%" gap={10}>
      <Box mt="80px">
        <TeacherNavTop />
        <Box
          as="form"
          onSubmit={handleSubmit}
          border="2px solid"
          borderColor="gray.200"
          borderRadius={10}
          p={8}
          maxW="720px"
          bg="white"
        >
          <Heading size="md" mb={2}>
            Create / update lesson quiz
          </Heading>
          <Text fontSize="sm" color="gray.600" mb={6}>
            One quiz per video lesson. Saving again replaces questions for that
            lesson.{" "}
            <Button as={Link} to="/Teacher/courses" variant="link" size="sm">
              Back to courses
            </Button>
          </Text>

          <FormControl mb={4}>
            <FormLabel>Course ID</FormLabel>
            <Input value={courseId || ""} isReadOnly bg="gray.50" />
          </FormControl>

          <FormControl mb={4} isRequired>
            <FormLabel>Lesson (video)</FormLabel>
            <Select
              placeholder={
                videosLoading
                  ? "Loading lessons…"
                  : videos.length === 0
                    ? "No lessons in this course"
                    : "Select a lesson"
              }
              value={selectedVideoId}
              onChange={(e) => setSelectedVideoId(e.target.value)}
              isDisabled={videosLoading || videos.length === 0}
            >
              {videos.map((v) => (
                <option key={String(v._id)} value={String(v._id)}>
                  {v.title || "Untitled lesson"}
                </option>
              ))}
            </Select>
          </FormControl>

          <FormControl mb={6}>
            <FormLabel>Quiz title</FormLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Week 1 check-in"
            />
          </FormControl>

          <VStack align="stretch" spacing={6}>
            {questions.map((q, qIdx) => (
              <Box
                key={qIdx}
                p={4}
                borderWidth="1px"
                borderRadius="md"
                borderColor="purple.100"
                bg="purple.50"
              >
                <HStack justify="space-between" mb={3}>
                  <Text fontWeight="bold">Question {qIdx + 1}</Text>
                  {questions.length > 1 ? (
                    <Button
                      size="xs"
                      variant="outline"
                      colorScheme="red"
                      onClick={() => removeQuestion(qIdx)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </HStack>
                <FormControl mb={3}>
                  <FormLabel fontSize="sm">Prompt</FormLabel>
                  <Textarea
                    value={q.prompt}
                    onChange={(e) =>
                      updateQuestion(qIdx, { prompt: e.target.value })
                    }
                    placeholder="What is …?"
                    rows={2}
                  />
                </FormControl>
                <FormControl mb={3}>
                  <FormLabel fontSize="sm">
                    Choices (one per line, top = index 0)
                  </FormLabel>
                  <Textarea
                    value={q.choicesText}
                    onChange={(e) =>
                      updateQuestion(qIdx, { choicesText: e.target.value })
                    }
                    rows={5}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Correct choice index</FormLabel>
                  <NumberInput
                    min={0}
                    max={20}
                    value={q.correctIndex}
                    onChange={(_, val) =>
                      updateQuestion(qIdx, {
                        correctIndex: Number.isFinite(val) ? val : 0,
                      })
                    }
                  >
                    <NumberInputField />
                  </NumberInput>
                </FormControl>
              </Box>
            ))}
          </VStack>

          <HStack mt={6} spacing={3}>
            <Button type="button" variant="outline" onClick={addQuestion}>
              Add question
            </Button>
            <Button
              type="submit"
              colorScheme="purple"
              isLoading={saving}
              isDisabled={!validCourseId || !selectedVideoId}
            >
              Save quiz
            </Button>
          </HStack>
        </Box>
      </Box>
    </Grid>
  );
}
