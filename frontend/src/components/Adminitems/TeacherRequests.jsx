import {
  Box,
  Button,
  Flex,
  Grid,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Badge,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import AdminNavTop from "../AdminNavTop";
import { API_BASE_URL } from "../../config/api";

const TeacherRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const userStore = useSelector((store) => store.UserReducer);
  const toast = useToast();

  const fetchRequests = () => {
    setLoading(true);
    axios
      .get(`${API_BASE_URL}/users/teacher-requests`, {
        headers: {
          Authorization: `Bearer ${userStore.token}`,
        },
      })
      .then((res) => {
        setRequests(res.data.requests || []);
        setLoading(false);
      })
      .catch((err) => {
        toast({
          title: "Error fetching requests",
          description: err.response?.data?.message || err.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setLoading(false);
      });
  };

  useEffect(() => {
    if (userStore.token) {
      fetchRequests();
    }
  }, [userStore.token]);

  const handleApprove = (userId, userName) => {
    axios
      .post(
        `${API_BASE_URL}/users/teacher-requests/approve/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${userStore.token}`,
          },
        }
      )
      .then((res) => {
        toast({
          title: "Request Approved",
          description: `${userName} is now a Teacher!`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        fetchRequests();
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: err.response?.data?.message || err.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      });
  };

  const handleReject = (userId, userName) => {
    axios
      .post(
        `${API_BASE_URL}/users/teacher-requests/reject/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${userStore.token}`,
          },
        }
      )
      .then((res) => {
        toast({
          title: "Request Rejected",
          description: `Request for ${userName} has been rejected.`,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        fetchRequests();
      })
      .catch((err) => {
        toast({
          title: "Error",
          description: err.response?.data?.message || err.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      });
  };

  return (
    <Grid className="Nav" h={"99vh"} w="94%" gap={10}>
      <Box mt="80px">
        <AdminNavTop />
        <Box p={5}>
          <Flex justify="space-between" mb={5} align="center">
            <Text fontSize="xl" fontWeight={"bold"}>
              Pending Teacher Requests
            </Text>
            <Badge colorScheme="blue" fontSize="md" p={1} borderRadius="md">
              {requests.length} Pending
            </Badge>
          </Flex>

          <Box
            w={{ xl: "100%", lg: "90%", md: "80%", base: "80%" }}
            maxWidth="100%"
            overflowX="auto"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="lg"
            boxShadow="sm"
          >
            <Table variant="striped" w="100%">
              <Thead bg="gray.50">
                <Tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>City</Th>
                  <Th>Age</Th>
                  <Th>Status</Th>
                  <Th textAlign="center">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {loading ? (
                  <Tr>
                    <Td colSpan={6} textAlign="center" py={10}>
                      <Text color="gray.500">Loading requests...</Text>
                    </Td>
                  </Tr>
                ) : requests.length === 0 ? (
                  <Tr>
                    <Td colSpan={6} textAlign="center" py={10}>
                      <Text color="gray.500">No pending teacher requests found.</Text>
                    </Td>
                  </Tr>
                ) : (
                  requests.map((el) => (
                    <Tr key={el._id}>
                      <Td fontWeight="medium">{el.name}</Td>
                      <Td>{el.email}</Td>
                      <Td>{el.city || "N/A"}</Td>
                      <Td>{el.age || "N/A"}</Td>
                      <Td>
                        <Badge colorScheme="warning" variant="solid">
                          {el.teacherRequestStatus}
                        </Badge>
                      </Td>
                      <Td>
                        <Flex justify="center" gap={3}>
                          <Button
                            colorScheme="green"
                            size="sm"
                            onClick={() => handleApprove(el._id, el.name)}
                          >
                            Approve
                          </Button>
                          <Button
                            colorScheme="red"
                            size="sm"
                            onClick={() => handleReject(el._id, el.name)}
                          >
                            Reject
                          </Button>
                        </Flex>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        </Box>
      </Box>
    </Grid>
  );
};

export default TeacherRequests;
