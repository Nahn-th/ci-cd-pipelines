import React from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  Image,
  Stack,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import SingleAbsolute from "./SingleAbsolute";
import SingleList from "./SingleList";
import { Link as RouterLink, useParams, useNavigate } from "react-router-dom";
// import axios from "axios";
import { useState, useEffect } from "react";
import Payment from "../../Pages/Payment/Payment";
import convertDateFormat from "../../Redux/AdminReducer/action";
import { capitalizeFirstLetter } from "../../Redux/UserReducer/action";
import { AiOutlineLock } from "react-icons/ai";
import Navbar from "../UserComponents/UserNavbar";
import Footer from "../../Pages/Footer";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../../config/api";

export default function SinglePage() {
  const [res, setRes] = useState({});
  const [videosLocked, setVideosLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const userStore = useSelector((store) => store.UserReducer);
  const token = userStore?.token;

  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    let cancelled = false;

    const authHeaders = {
      "Content-Type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    };

    async function load() {
      if (!id) return;
      setVideosLocked(false);
      setLockMessage("");
      setIsEnrolled(false);

      if (!token) {
        setIsEnrolled(false);
        setVideosLocked(true);
        setLockMessage("Sign in and enroll in this course to watch videos.");
        setRes({});
        return;
      }

      try {
        const enrollRes = await fetch(
          `${API_BASE_URL}/users/enrollment/${id}`,
          { headers: authHeaders }
        );
        const enrollJson = await enrollRes.json().catch(() => ({}));
        if (cancelled) return;

        if (!enrollRes.ok) {
          setIsEnrolled(false);
          setVideosLocked(true);
          setLockMessage(
            enrollJson.message || "Could not verify enrollment. Try signing in again."
          );
          setRes({});
          return;
        }

        setIsEnrolled(!!enrollJson.enrolled);

        if (!enrollJson.enrolled) {
          setVideosLocked(true);
          setLockMessage(
            "You are not enrolled in this course. Purchase or subscribe to unlock the full video library."
          );
          const courseRes = await fetch(`${API_BASE_URL}/courses/${id}`, {
            headers: authHeaders,
          });
          const courseJson = await courseRes.json().catch(() => ({}));
          if (cancelled) return;
          if (courseJson.course) {
            setRes({ course: { ...courseJson.course, videos: [] } });
          } else {
            setRes({});
          }
          return;
        }

        const vdoRes = await fetch(
          `${API_BASE_URL}/videos/courseVideos/${id}`,
          {
            method: "GET",
            headers: authHeaders,
          }
        );
        const vdoJson = await vdoRes.json().catch(() => ({}));
        if (cancelled) return;

        if (vdoRes.status === 403) {
          setVideosLocked(true);
          setLockMessage(
            vdoJson.message ||
              "You must be enrolled in this course to view its videos."
          );
          const courseRes = await fetch(`${API_BASE_URL}/courses/${id}`, {
            headers: authHeaders,
          });
          const courseJson = await courseRes.json().catch(() => ({}));
          if (!cancelled && courseJson.course) {
            setRes({ course: { ...courseJson.course, videos: [] } });
          } else if (!cancelled) {
            setRes({});
          }
          return;
        }

        if (!vdoRes.ok) {
          setLockMessage(vdoJson.message || "Failed to load course videos.");
          setRes(vdoJson || {});
          return;
        }

        setRes(vdoJson);
      } catch (err) {
        if (!cancelled) console.log(err);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  // prevent click on video
  const handleClickPrevent = (event) => {
    event.preventDefault();
  };

  return (
    <div>
      <Navbar />
      <div className=" w-full flex justify-center items-center flex-col">
        <div className="w-full bg-neutral-800 flex justify-center p-5">
          <div
            style={{ paddingTop: "100px" }}
            className=" xl:max-h-[320px] px-2  max-w-[598px] xl:max-w-[900px]"
          >
            <div className="xl:flex xl:space-x-4">
              <Box className=" my-8 ">
                <Box
                  className="outerBox"
                  color="white"
                  width="100%"
                  fontFamily="sans-serif"
                >
                  <Box className="space-y-2">
                    <Box className="title " fontWeight="bold">
                      <Text fontSize="2rem">
                        {res?.course?.title || "Course Name"}
                      </Text>
                    </Box>

                    <Box className="description text-[16px] font-thin" w="40vw">
                      {res?.course?.description}
                    </Box>

                    {isEnrolled && id ? (
                      <Box mt={3}>
                        <Button
                          as={RouterLink}
                          to={`/course/${id}/learn`}
                          colorScheme="purple"
                          size="md"
                        >
                          Continue learning
                        </Button>
                      </Box>
                    ) : null}

                    <Box
                      className="rating space-x-2"
                      display="flex"
                      fontWeight="5px"
                    >
                      <Box className="text-yellow-300 text-xs">4.8</Box>
                      <Box className="text-[11px]">⭐⭐⭐⭐</Box>
                      <Box className="flex text-[12px] space-x-2">
                        <Box color="#a435f0">(12866 ratings)</Box>
                        <Box>69107 students</Box>
                      </Box>
                    </Box>

                    <Box className="createdby space-x-2" display="flex">
                      <Box className="text-[12px]">
                        <p>Created by</p>
                      </Box>
                      <Box color="#a435f0" className="text-[12px] underline ">
                        {res?.course?.teacher}
                      </Box>
                    </Box>

                    <Box className="text-[12px] space-x-4" display="flex">
                      <Box>🌗 Last updated 5/2023</Box>
                      <Box>🌐 English</Box>
                      <Box display="flex">
                        ⌨️ English [Auto], Arabic [Auto]{" , "}
                        <Box color="#a435f0">12 more</Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
              <div className="mt-6">
                <SingleAbsolute props={{ ...res?.course, onOpen, onClose }} />{" "}
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-[598px] xl:mr-72">
          <SingleList />
        </div>
        <Box mt="1rem" bg="#D7DBDD" w="95%" p="5">
          <Flex justify="center">
            <Heading size="xl">
              {capitalizeFirstLetter(res?.course?.title) || "Course Name"}
            </Heading>
          </Flex>
          <Flex mt="1rem" justify="center">
            <Heading size="md">Teacher:</Heading>
            <Heading size="md" ml="1rem">
              {capitalizeFirstLetter(res?.course?.teacher) || "Teacher Name"}
            </Heading>
          </Flex>
          <Flex mt="1rem" justify="center">
            <Heading size="md">Course Created:</Heading>
            <Heading size="md" ml="1rem">
              {convertDateFormat(res?.course?.createdAt)}
            </Heading>
          </Flex>
          <Flex mt="1rem" justify="center">
            <Heading size="md">Total Videos:</Heading>
            <Heading size="md" ml="1rem">
              {res?.course?.videos?.length || 0}
            </Heading>
          </Flex>
        </Box>

        {videosLocked ? (
          <Box
            mt="3rem"
            p="2rem"
            border="1px solid"
            borderColor="gray.300"
            borderRadius="md"
            bg="gray.50"
            maxW="720px"
            mx="auto"
            textAlign="center"
          >
            <Flex justify="center" mb="3">
              <AiOutlineLock color="tomato" size="48px" />
            </Flex>
            <Text fontSize="1.1rem" fontWeight="bold" mb="2">
              Videos locked
            </Text>
            <Text mb="4" color="gray.700">
              {lockMessage}
            </Text>
            <Button
              as={RouterLink}
              to={`/course/${id}/enroll`}
              colorScheme="purple"
              mb={3}
              w={{ base: "100%", sm: "auto" }}
            >
              Enroll in course
            </Button>
            <Button colorScheme="gray" variant="outline" onClick={onOpen}>
              View purchase options
            </Button>
          </Box>
        ) : res?.course?.videos?.length ? (
          <Box mt="40px">
            {res?.course?.videos?.map((video, index) => {
              return (
                <div key={video._id || index}>
                  <Card
                    direction={{ base: "column", sm: "row" }}
                    overflow="hidden"
                    variant="outline"
                    border="1px solid"
                    m="15px"
                  >
                    <Box onClick={handleClickPrevent} position="relative" _hover={{cursor:'not-allowed'}} w='20vw' p='1rem' display='flex' justifyContent='center' alignItems='center'>
                      <Image w='100%'  src={video?.img || ''} alt={video?.title}/>
                      {
                        <Box
                          onClick={handleClickPrevent}
                          position="absolute"
                        >
                          <AiOutlineLock color="tomato" size="45px" />
                        </Box>
                      }
                    </Box>
                    <Stack>
                      <CardBody>
                        <Heading size="md">{video?.title || 'Video Name'}</Heading>
                        <Text py="2">{video.description}</Text>
                        <Text size="12px">
                          <Text fontWeight="bold" display="inline" mr="5px">
                            Instructor:
                          </Text>
                          {capitalizeFirstLetter(video?.teacher) || 'Teacher Name'}
                        </Text>
                        <Text size="12px">
                          <Text fontWeight="bold" display="inline" mr="5px">
                            Date:
                          </Text>
                          {convertDateFormat(video?.createdAt)}
                        </Text>
                        <Text>
                          <Text fontWeight="bold" display="inline" mr="5px">
                            Views:
                          </Text>
                          {video?.views || 0}
                        </Text>
                      </CardBody>
                    </Stack>
                  </Card>
                </div>
              );
            })}
          </Box>
        ) : (
          <Box mt="3rem" p="1rem 0" borderBottom="1px solid gray" mb="1rem">
            <Text fontSize="1.2rem" fontWeight="bold">
              We are Working On Content of this course. You will soon get Video.
            </Text>
          </Box>
        )}

        <div>
          <Payment isOpen={isOpen} onOpen={onOpen} onClose={onClose} />
        </div>
        <Box>
          <Footer />
        </Box>
      </div>
    </div>
  );
}