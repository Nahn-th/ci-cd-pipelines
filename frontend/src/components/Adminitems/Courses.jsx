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
import { AddIcon, EditIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";
import { useDispatch, useSelector } from "react-redux";
import convertDateFormat, {
  deleteProduct,
  getProduct,
  approveCourse,
  rejectCourse,
} from "../../Redux/AdminReducer/action";
import Pagination from "./Pagination";
import AdminNavTop from "../AdminNavTop";
import Navbar from "../UserComponents/UserNavbar";
import AdminUploadPDFContext from "../AdminUploadPDFContext";

const Courses = () => {
  const store = useSelector((store) => store.AdminReducer.data);
  const dispatch = useDispatch();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [uploadCourseId, setUploadCourseId] = useState(null);
  const limit = 4;
  const token = useSelector((s) => s.UserReducer?.token);
  const tableSize = useBreakpointValue({ base: "sm", sm: "md", md: "lg" });
  const courseSize = useBreakpointValue({ base: "md", sm: "lg", md: "xl" });

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };
  const handleSelect = (e) => {
    const { value } = e.target;
    setOrder(value);
  };

  useEffect(() => {
    dispatch(getProduct(page, limit, search, order));
  }, [page, search, order, limit]);

  const handleDelete = (id, title) => {
    dispatch(deleteProduct(id));
    alert(`${title} is Deleted`);
  };

  const handleApprove = (id, title) => {
    dispatch(approveCourse(id));
    alert(`${title} has been approved and published!`);
  };

  const handleReject = (id, title) => {
    dispatch(rejectCourse(id));
    alert(`${title} has been rejected.`);
  };

  const handlePageChange = (page) => {
    setPage(page);
  };
  const count = 4;

  const handlePageButton = (val) => {
    setPage((prev) => prev + val);
  };

  // Filter by status on frontend
  const filteredStore = Array.isArray(store)
    ? store.filter((el) => {
        if (!el) return false;
        if (filterStatus === "all") return true;
        return el.status === filterStatus;
      })
    : [];

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge colorScheme="yellow">Pending</Badge>;
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
      <Box mt='90px'>
          <AdminNavTop handleSearch={handleSearch} />
        <Box className={`course ${courseSize}`}>
          <Grid
            templateColumns={{
              xl: "repeat(4,15% 30% 30% 25%)",
              lg: "repeat(4,15% 30% 30% 25%)",
              base: "repeat(1,1fr)",
            }}
            gap={{ xl: 0, lg: 0, base: 7 }}
          >
            <Text fontWeight={"bold"}>Course Management</Text>
            <Select w={"80%"} onChange={handleSelect}>
              <option value="asc">Price Sort Ascending</option>
              <option value="desc">Price Sort Descending</option>
            </Select>
            <Select w={"80%"} placeholder="Filter by status" onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Courses</option>
              <option value="pending">Pending Approval</option>
              <option value="published">Published</option>
              <option value="rejected">Rejected</option>
            </Select>
            <Box fontWeight={"bold"}>
              <Link to="/admin/addCourse">Create</Link>
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
                  <Th>Price</Th>
                  <Th>Teacher</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              {filteredStore?.length > 0 &&
                filteredStore?.map((el, i) => {
                  return (
                    <Tbody key={i}>
                      <Tr>
                        <Td>{el.title}</Td>
                        <Td>{convertDateFormat(el.createdAt)}</Td>
                        <Td>{el.category}</Td>
                        <Td>{el.price}</Td>
                        <Td>{el.teacher}</Td>
                        <Td>{getStatusBadge(el.status)}</Td>
                        <Td>
                          <Flex gap={2} flexWrap="wrap">
                            {el.status === "pending" && (
                              <>
                                <Button
                                  size="xs"
                                  colorScheme="green"
                                  leftIcon={<CheckIcon />}
                                  onClick={() => handleApprove(el._id, el.title)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="xs"
                                  colorScheme="red"
                                  leftIcon={<CloseIcon />}
                                  onClick={() => handleReject(el._id, el.title)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              size="xs"
                              colorScheme="red"
                              variant="outline"
                              onClick={() => handleDelete(el._id, el.title)}
                            >
                              Delete
                            </Button>
                            <Link to={`/admin/edit/${el._id}`}>
                              <ButtonGroup size="xs" isAttached variant="outline">
                                <Button>Edit</Button>
                                <IconButton
                                  aria-label="Edit course"
                                  icon={<EditIcon />}
                                />
                              </ButtonGroup>
                            </Link>
                          </Flex>
                          {uploadCourseId === el._id ? (
                            <Box mt={2} w="100%">
                              <AdminUploadPDFContext courseId={el._id} token={token} />
                              <Button size="xs" mt={1} variant="ghost" colorScheme="red" onClick={() => setUploadCourseId(null)}>
                                Close
                              </Button>
                            </Box>
                          ) : (
                            <Button size="xs" colorScheme="teal" variant="outline" mt={1} onClick={() => setUploadCourseId(el._id)}>
                              Upload Material
                            </Button>
                          )}
                        </Td>
                      </Tr>
                    </Tbody>
                  );
                })}
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
};

export default Courses;