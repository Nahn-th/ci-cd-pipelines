import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Grid,
  Button,
  IconButton,
  Text,
  Image,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { useSelector } from "react-redux";
import Card from "../../Pages/LandingPageComponents/Card";
import LoadingComponent from "../../Pages/LoadingComponents/LoadingComponent";
import { API_BASE_URL } from "../../config/api";

const ITEMS_PER_PAGE = 10;

const InProgressCoursesGrid = () => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const token = useSelector((s) => s.UserReducer?.token);
  const userId = useSelector((s) => s.UserReducer?.userId);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const url = `${API_BASE_URL}/users/userCourse/${userId}`;
    setLoading(true);

    fetch(url)
      .then((response) => {
        if (response.ok) return response.json();
        throw new Error("Error: " + response.status);
      })
      .then((data) => {
        setCourses(data.course || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error:", error);
        setLoading(false);
      });
  }, [userId]);

  // Reset page when courses change
  useEffect(() => {
    setCurrentPage(1);
  }, [courses.length]);

  const totalPages = Math.max(1, Math.ceil(courses.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentCourses = courses.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 2);
      let end = Math.min(totalPages - 1, currentPage + 2);

      if (currentPage <= 3) end = Math.min(maxVisible - 1, totalPages - 1);
      if (currentPage >= totalPages - 2) start = Math.max(2, totalPages - maxVisible + 2);

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  if (!loading && courses.length === 0) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        bg="#F7F3EA"
        p={8}
        borderRadius="md"
        minH="300px"
      >
        <Box w={{ base: "100%", md: "30%" }}>
          <Image
            display="block"
            w="100%"
            src="https://cdn.dribbble.com/users/1693462/screenshots/3504905/media/6d5a0df598037bf7a872f1f8aef118b8.gif"
            alt="Empty"
          />
        </Box>
        <Text fontWeight="bold" mt={4}>
          You haven't subscribed to any course
        </Text>
      </Flex>
    );
  }

  return (
    <Box w="100%">
      {loading ? (
        <Grid
          templateColumns={{
            base: "repeat(1, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(5, 1fr)",
          }}
          gap={4}
        >
          {[1, 2, 3, 4, 5].map((el) => (
            <LoadingComponent key={el} />
          ))}
        </Grid>
      ) : (
        <>
          <Grid
            templateColumns={{
              base: "repeat(1, 1fr)",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(5, 1fr)",
            }}
            gap={4}
          >
            {currentCourses.map((el) => (
              <Box key={el._id} h="100%">
                <Card {...el} resumeLearning />
              </Box>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Flex
              justify="center"
              align="center"
              mt={8}
              mb={4}
              gap={2}
              flexWrap="wrap"
              w="100%"
              borderTop="1px solid"
              borderColor="gray.200"
              pt={6}
            >
              <Button
                leftIcon={<ChevronLeftIcon />}
                onClick={() => handlePageChange(currentPage - 1)}
                isDisabled={currentPage === 1}
                variant="outline"
                colorScheme="purple"
                size="sm"
                borderRadius="md"
              >
                Trang trước
              </Button>

              <Flex gap={1} align="center">
                {getPageNumbers().map((page, idx) =>
                  page === "..." ? (
                    <Text key={`ellipsis-${idx}`} px={2} color="gray.400" fontWeight="bold" fontSize="sm">
                      ...
                    </Text>
                  ) : (
                    <Button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      size="sm"
                      minW="40px"
                      borderRadius="md"
                      fontWeight={currentPage === page ? "bold" : "normal"}
                      colorScheme={currentPage === page ? "purple" : "gray"}
                      variant={currentPage === page ? "solid" : "ghost"}
                      _hover={{ bg: currentPage === page ? "purple.600" : "purple.100" }}
                      border={currentPage !== page ? "1px solid" : "none"}
                      borderColor="gray.300"
                    >
                      {page}
                    </Button>
                  )
                )}
              </Flex>

              <Button
                rightIcon={<ChevronRightIcon />}
                onClick={() => handlePageChange(currentPage + 1)}
                isDisabled={currentPage === totalPages}
                variant="outline"
                colorScheme="purple"
                size="sm"
                borderRadius="md"
              >
                Trang sau
              </Button>

              <Text fontSize="sm" color="gray.500" ml={2}>
                Trang {currentPage}/{totalPages} ({courses.length} khóa học)
              </Text>
            </Flex>
          )}
        </>
      )}
    </Box>
  );
};

export default InProgressCoursesGrid;