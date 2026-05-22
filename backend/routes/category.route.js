const express = require("express");
const { auth } = require("../middlewares/users.middleware");
const { CategoryModel } = require("../models/category.model");

const categoryRouter = express.Router();

// Public: get all categories
categoryRouter.get("/", async (req, res) => {
  try {
    const categories = await CategoryModel.find().sort({ name: 1 });
    res.status(200).json({ categories });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
});

// Admin only: add a category
categoryRouter.post("/add", auth, async (req, res) => {
  try {
    if (req.body.role !== "admin") {
      return res.status(403).json({ error: "Only admin can add categories" });
    }
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }
    const existing = await CategoryModel.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ message: "Category already exists" });
    }
    const category = await CategoryModel.create({ name: name.trim() });
    res.status(201).json({ message: "Category created", category });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
});

// Admin only: delete a category
categoryRouter.delete("/:id", auth, async (req, res) => {
  try {
    if (req.body.role !== "admin") {
      return res.status(403).json({ error: "Only admin can delete categories" });
    }
    await CategoryModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
});

module.exports = { categoryRouter };