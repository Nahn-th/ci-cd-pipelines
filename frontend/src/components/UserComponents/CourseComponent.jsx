import React, { useEffect, useState } from "react";
import { Box, Heading, Stack, Flex, Select } from "@chakra-ui/react";
import { useSelector } from "react-redux";
import AllCoursesGrid from "./AllCoursesGrid";
import InProgressCoursesGrid from "./InProgressCoursesGrid";
import { API_BASE_URL } from "../../config/api";

const CourseComponent = () => {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    fetch(`${API_BASE_URL}/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  return (
    <Box p={4}>
      {/* Courses Section with Category Dropdown */}
      <Stack spacing={4} mb={8}>
        <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
          <Heading as="h2" size="lg">
            Courses
          </Heading>
          <Select
            w={{ base: "100%", sm: "250px" }}
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            borderRadius="md"
            borderColor="gray.300"
            _focus={{ borderColor: "purple.500" }}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </Select>
        </Flex>
        <AllCoursesGrid category={activeCategory === "all" ? null : activeCategory} />
      </Stack>

      <Stack spacing={4} mb={4}>
        <Heading as="h2" size="lg">
          In Progress Courses
        </Heading>
        <Box>
          <InProgressCoursesGrid />
        </Box>
      </Stack>
    </Box>
  );
};

export default CourseComponent;