import {
  Box,
  Badge,
  Button,
  ButtonGroup,
  Flex,
  Grid,
  IconButton,
  Select,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Table, Thead, Tbody, Tr, Th, Td } from "@chakra-ui/react";
import { AddIcon, EditIcon } from "@chakra-ui/icons";
import { useDispatch, useSelector } from "react-redux";
import convertDateFormat, {
  deleteProduct,
  getProduct,
} from "../../Redux/TeacherReducer/action";
import Pagination from "../Adminitems/Pagination";
import TeacherNavTop from "./TeacherNavTop";
import Navbar from "../UserComponents/UserNavbar";
import AdminUploadPDFContext from "../AdminUploadPDFContext";
import { useToast } from "@chakra-ui/react";


export default function TeacherCourses() {
  const store = useSelector((store) => store.TeacherReducer.data);
  const dispatch = useDispatch();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("");
  const [uploadCourseId, setUploadCourseId] = useState(null);
  const limit = 4;
  const tableSize = useBreakpointValue({ base: "sm", sm: "md", md: "lg" });
  const courseSize = useBreakpointValue({ base: "md", sm: "lg", md: "xl" });
  const toast = useToast();
  const token = useSelector((s) => s.UserReducer?.token);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    // console.log(search)
  };
  const handleSelect = (e) => {
    const { value } = e.target;
    setOrder(value);
  };
  // console.log(order)

  useEffect(() => {
    dispatch(getProduct(page, limit, search, order));
  }, [page, search, order, limit]);

  const handleDelete = (id, title) => {
    // console.log(id)
    dispatch(deleteProduct(id));
    alert(`${title} is Deleted`);
  };

  const handlePageChange = (page) => {
    setPage(page);
  };
  // console.log("store.length",store.length)
  const count = 4;
  // console.log("count",count)

  const handlePageButton = (val) => {
    setPage((prev) => prev + val);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge colorScheme="yellow">Pending Approval</Badge>;
      case "published":
        return <Badge colorScheme="green">Published</Badge>;
      case "rejected":
        return <Badge colorScheme="red">Rejected</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <Grid className="Nav" h={"99vh"} w="94%" gap={10}>
      {/* <AdminSidebar/>  */}
      <Box mt='90px'>
        <TeacherNavTop handleSearch={handleSearch} />
        {/*  */}
        <Box className={`course ${courseSize}`}>
          <Grid
            templateColumns={{
              xl: "repeat(3,20% 60% 20%)",
              lg: "repeat(3,20% 60% 20%)",
              base: "repeat(1,1fr)",
            }}
            gap={{ xl: 0, lg: 0, base: 7 }}
          >
            <Text fontWeight={"bold"}>Welcome To Course</Text>
            <Select w={"80%"} onChange={handleSelect}>
              <option value="asc">Price Sort in Ascending Order</option>
              <option value="desc">Price Sort in Descending Order</option>
            </Select>
            <Box fontWeight={"bold"}>
              <Link to="/Teacher/addCourse">Create</Link>
            </Box>
          </Grid>
          <Box
            w={{ xl: "100%", lg: "90%", md: "80%", base: "80%" }}
            overflowX="auto"
          >
            <Table
              variant="striped"
              borderRadius="md"
              w="100%"
              size={tableSize}
            >
              <Thead>
                <Tr>
                  <Th>Title</Th>
                  <Th>Date</Th>
                  <Th>Category</Th>
                  <Th>Description</Th>
                  <Th>Price</Th>
                  <Th>Teacher</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>

              <Tbody>
                {store?.length > 0 &&
                  store.map((el, i) => {
                    if (!el) return null;

                    return (
                  <Tr key={el?._id || i}>
                    <Td>{el?.title || "N/A"}</Td>
                    <Td>{el?.createdAt ? convertDateFormat(el?.createdAt) : "N/A"}</Td>
                    <Td>{el?.category}</Td>
                    <Td>{el?.description?.substring(0, 20)}...</Td>
                    <Td>{el?.price}</Td>
                    <Td>{el?.teacher}</Td>
                    <Td>{getStatusBadge(el?.status)}</Td>
                    <Td>
                      <Flex gap={2} flexWrap="wrap">
                        <Button
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleDelete(el?._id, el?.title)}
                        >
                          Delete
                        </Button>
                        <Link to={`/Teacher/create-quiz/${el?._id}`}>
                          <Button size="sm" colorScheme="purple" variant="outline">
                            Lesson quiz
                          </Button>
                        </Link>
                        <Link to={`/Teacher/edit/${el?._id}`}>
                          <ButtonGroup size="sm" isAttached variant="outline">
                            <Button>Edit</Button>
                            <IconButton
                              aria-label="Edit course"
                              icon={<EditIcon />}
                            />
                          </ButtonGroup>
                        </Link>
                        {uploadCourseId === el?._id ? (
                          <Box w="100%" mt={2}>
                            <AdminUploadPDFContext 
                              courseId={el?._id} 
                              token={token}
                            />
                            <Button 
                              size="xs" 
                              mt={1} 
                              variant="ghost" 
                              colorScheme="red"
                              onClick={() => setUploadCourseId(null)}
                            >
                              Close
                            </Button>
                          </Box>
                        ) : (
                          <Button
                            size="sm"
                            colorScheme="teal"
                            variant="outline"
                            onClick={() => setUploadCourseId(el?._id)}
                          >
                            Upload Material
                          </Button>
                        )}
                      </Flex>
                    </Td>
                  </Tr>
                    );
                  })}
              </Tbody>
            </Table>
          </Box>
          <Box textAlign={{ xl: "right", lg: "right", base: "left" }}>
            <Button disabled={page <= 1} onClick={() => handlePageButton(-1)}>
              Prev
            </Button>
            <Pagination
              totalCount={count}
              current_page={page}
              handlePageChange={handlePageChange}
            />
            <Button
              disabled={page >= count}
              onClick={() => handlePageButton(1)}
            >
              Next
            </Button>
          </Box>
        </Box>
      </Box>
    </Grid>
  );
}