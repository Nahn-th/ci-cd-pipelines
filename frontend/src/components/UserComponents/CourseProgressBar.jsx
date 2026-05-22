import React, { useEffect, useState, useCallback } from 'react';
import { Box, Progress, HStack, Text, VStack, Badge, Button } from '@chakra-ui/react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CourseProgressBar = ({ courseId, userId, token }) => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/videos/progress/${courseId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setProgress(response.data);
    } catch (err) {
      console.error('Error fetching progress:', err);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }, [courseId, token, API_URL]);

  useEffect(() => {
    if (courseId && userId && token) {
      fetchProgress();
    }
  }, [courseId, userId, token, fetchProgress]);

  if (loading || !progress) {
    return null;
  }

  const progressColor = progress.isCompleted ? 'green' : 'blue';
  const statusText = progress.isCompleted
    ? '✅ Course Completed!'
    : `${progress.watchedCount}/${progress.totalCount} videos watched`;

  return (
    <Box bg="white" p={4} borderRadius="lg" boxShadow="md" mb={4}>
      <VStack align="stretch" spacing={3}>
        {/* Header */}
        <HStack justify="space-between" align="center">
          <Text fontWeight="bold" fontSize="lg">
            📚 Learning Progress
          </Text>
          <Badge
            colorScheme={progressColor}
            fontSize="md"
            px="3"
            py="1"
          >
            {progress.progressPercentage}%
          </Badge>
        </HStack>

        {/* Progress Bar */}
        <Box>
          <Progress
            value={progress.progressPercentage}
            size="lg"
            colorScheme={progressColor}
            borderRadius="lg"
            hasStripe
            isAnimated={!progress.isCompleted}
          />
        </Box>

        {/* Status Text */}
        <Text fontSize="sm" color="gray.600">
          {statusText}
        </Text>

        {/* Completion Message & Quiz Button */}
        {progress.isCompleted && (
          <Box
            bg="green.50"
            border="2px solid"
            borderColor="green.500"
            p={3}
            borderRadius="md"
          >
            <VStack align="stretch" spacing={2}>
              <Box>
                <Text color="green.700" fontWeight="bold">
                  🎉 Great! You've completed all videos!
                </Text>
                <Text color="green.600" fontSize="sm" mt={1}>
                  Ready to take the final quiz and earn your certificate?
                </Text>
              </Box>
              <Button
                colorScheme="green"
                size="md"
                width="full"
                fontWeight="bold"
                onClick={() => navigate(`/quiz/${courseId}`)}
              >
                🎓 Take Final Quiz
              </Button>
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default CourseProgressBar;
