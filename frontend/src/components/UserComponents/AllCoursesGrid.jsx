import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Grid,
  Button,
  IconButton,
  Text,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { useSelector } from "react-redux";
import Card from "../../Pages/LandingPageComponents/Card";
import LoadingComponent from "../../Pages/LoadingComponents/LoadingComponent";
import { API_BASE_URL } from "../../config/api";

const ITEMS_PER_PAGE = 10;

const AllCoursesGrid = ({ category }) => {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const token = useSelector((s) => s.UserReducer?.token);

  // Filter courses by category
  const filteredCourses = category
    ? courses.filter(
        (c) => c.category?.toLowerCase() === category.toLowerCase()
      )
    : courses;

  useEffect(() => {
    const url = `${API_BASE_URL}/courses/all?limit=100`;
    setLoading(true);

    const fetchAll = async () => {
      try {
        const [coursesRes, enrolledRes] = await Promise.all([
          fetch(url).then((r) => r.json()),
          token
            ? fetch(`${API_BASE_URL}/users/enrolled-courses`, {
                headers: {
                  "Content-Type": "application/json",
                  authorization: `Bearer ${token}`,
                },
              }).then((r) => r.json())
            : Promise.resolve({ enrolledCourseIds: [] }),
        ]);

        setCourses(coursesRes.course || []);
        setEnrolledIds(
          (enrolledRes.enrolledCourseIds || []).map((id) => id.toString())
        );
      } catch {
        console.error("Error fetching courses");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [token]);

  // Reset to page 1 when category changes or courses change
  useEffect(() => {
    setCurrentPage(1);
  }, [courses.length, category]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentCourses = filteredCourses.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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

      if (currentPage <= 3) {
        end = Math.min(maxVisible - 1, totalPages - 1);
      }
      if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - maxVisible + 2);
      }

      if (start > 2) pages.push("...");
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

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
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((el) => (
            <LoadingComponent key={el} />
          ))}
        </Grid>
      ) : (
        <>
          {/* Course Grid */}
          <Grid
            templateColumns={{
              base: "repeat(1, 1fr)",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(5, 1fr)",
            }}
            gap={4}
          >
            {currentCourses.map((el) => {
              const isEnrolled = enrolledIds.includes(el._id);
              return (
                <Box key={el._id} h="100%">
                  <Card {...el} resumeLearning={isEnrolled} />
                </Box>
              );
            })}
          </Grid>

          {/* Pagination */}
          {courses.length > 0 && (
            <Flex
              justify="center"
              align="center"
              mt={8}
              mb={6}
              gap={2}
              flexWrap="wrap"
              w="100%"
              borderTop="1px solid"
              borderColor="gray.200"
              pt={6}
            >
              {/* Trang trước button */}
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

              {/* Page Numbers */}
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
                      _hover={{
                        bg: currentPage === page ? "purple.600" : "purple.100",
                      }}
                      border={currentPage !== page ? "1px solid" : "none"}
                      borderColor="gray.300"
                    >
                      {page}
                    </Button>
                  )
                )}
              </Flex>

              {/* Trang sau button */}
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

              {/* Page info */}
              <Text fontSize="sm" color="gray.500" ml={2}>
                Trang {currentPage}/{totalPages} ({filteredCourses.length} khóa học)
              </Text>
            </Flex>
          )}

          {/* If no courses */}
          {filteredCourses.length === 0 && !loading && (
            <Flex justify="center" align="center" minH="200px">
              <Text color="gray.500" fontSize="lg">
                {courses.length === 0
                  ? "Không có khóa học nào."
                  : `Không có khóa học nào trong danh mục "${category}".`}
              </Text>
            </Flex>
          )}
        </>
      )}
    </Box>
  );
};

export default AllCoursesGrid;