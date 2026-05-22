import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Text,
  VStack,
  HStack,
  IconButton,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { DeleteIcon, AddIcon } from "@chakra-ui/icons";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../../config/api";

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const token = useSelector((s) => s.UserReducer?.token);
  const toast = useToast();

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {
      toast({ title: "Lỗi tải danh mục", status: "error", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async () => {
    if (!newCategory.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE_URL}/categories/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategory.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Đã thêm danh mục", status: "success", duration: 3000 });
        setNewCategory("");
        fetchCategories();
      } else {
        toast({ title: data.message || "Lỗi", status: "error", duration: 3000 });
      }
    } catch {
      toast({ title: "Lỗi kết nối", status: "error", duration: 3000 });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast({ title: "Đã xóa danh mục", status: "success", duration: 3000 });
        fetchCategories();
      }
    } catch {
      toast({ title: "Lỗi", status: "error", duration: 3000 });
    }
  };

  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>Manage Categories</Heading>

      <Flex gap={3} mb={6}>
        <Input
          placeholder="New category name..."
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAdd()}
          maxW="300px"
        />
        <Button
          leftIcon={<AddIcon />}
          colorScheme="purple"
          isLoading={adding}
          onClick={handleAdd}
          isDisabled={!newCategory.trim()}
        >
          Add
        </Button>
      </Flex>

      {loading ? (
        <Spinner />
      ) : categories.length === 0 ? (
        <Text color="gray.500">No categories yet.</Text>
      ) : (
        <VStack align="stretch" spacing={2} maxW="400px">
          {categories.map((cat) => (
            <Flex
              key={cat._id}
              justify="space-between"
              align="center"
              p={3}
              bg="gray.50"
              borderRadius="md"
            >
              <Text fontWeight="medium">{cat.name}</Text>
              <IconButton
                icon={<DeleteIcon />}
                size="sm"
                colorScheme="red"
                variant="ghost"
                onClick={() => handleDelete(cat._id)}
                aria-label="Delete category"
              />
            </Flex>
          ))}
        </VStack>
      )}
    </Box>
  );
};

export default ManageCategories;