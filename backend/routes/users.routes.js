const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { UserModel } = require("../models/users.models");
const jwt = require("jsonwebtoken");
const { auth } = require("../middlewares/users.middleware");
const { BlackListModel } = require("../models/blacklist");

const userRouter = express.Router();

//give all user list
// Access: admin
// EndPoint: /users/;
// FRONTEND: when user/admin/teacher want to register in site;

userRouter.get("/", auth, async (req, res) => {
  try {
    if (req.body.role == "admin") {
      let users = await await UserModel.find();
      res.status(200).json({ users });
    } else {
      res.status(401).json({ error: "you don't have access to users" });
    }
  } catch (err) {
    console.log(err);
    res
      .status(400)
      .json({ message: "something went wrong", error: err.message });
  }
});

// userRouter.get("/", auth, async (req, res) => {
//   try {
//     if (req.user.role === "admin") { // Assuming role is stored in req.user
//       const { page, limit } = req.query;
//       const pageNumber = parseInt(page, 10) || 1; // Convert to integer with a default value of 1
//       const limitNumber = parseInt(limit, 10) || 10; // Convert to integer with a default value of 10
      
//       // Use pageNumber and limitNumber in your database query or pagination logic
//       const users = await UserModel.find()
//         .skip((pageNumber - 1) * limitNumber)
//         .limit(limitNumber);
      
//       res.status(200).json({ users });
//     } else {
//       res.status(401).json({ error: "You don't have access to users" });
//     }
//   } catch (err) {
//     console.error('error');
//     res.status(500).json({ message: "Something went wrong", error: err.message });
//   }
// });

//registration
// Access: all
// EndPoint: /user/register;
// FRONTEND: when user/admin/teacher want to register in site;
userRouter.post("/register", async (req, res) => {
  try {
    const { name, email, password, age, city, job, image } = req.body;
    
    // 1. Kiểm tra user tồn tại
    const registeredUser = await UserModel.findOne({ email });
    if (registeredUser) {
      return res.status(409).json({ msg: "User already exist. Please Login!!" });
    }

    // 2. Hash mật khẩu (Dùng await thay vì callback)
    const saltRounds = 5;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Tạo instance user mới
    const user = new UserModel({
      name,
      email,
      password: hashedPassword,
      age,
      city,
      job,
      image,
    });

    // 4. Lưu vào Database
    const savedUser = await user.save();
    
    // In ra terminal để chắc chắn dữ liệu đã đi
    console.log("===> Đã lưu user vào Atlas thành công:", savedUser._id);

    res.status(201).json({ msg: "user created succesfully", user: savedUser });

  } catch (error) {
    // TẤT CẢ lỗi từ DB, Validation, kết nối... sẽ nhảy vào đây
    console.error("===> LỖI TẠI REGISTER:", error.message);
    res.status(500).json({ 
        message: "Something went wrong during registration", 
        error: error.message 
    });
  }
});

// login for users;
// Access: All;
// EndPoint: /users/login;
// FRONTEND: when Admin/user/teacher want to login

userRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await UserModel.findOne({ email });
    if (user) {
      bcrypt.compare(password, user.password, (err, result) => {
        // result == true

        const token = jwt.sign(
          { userId: user._id, user: user.name, role: user.role },
          "SRM",
          {
            expiresIn: "7d",
          }
        );
        const rToken = jwt.sign(
          { userId: user._id, user: user.name },
          "SRM",
          {
            expiresIn: "24d",
          }
        );
        if (result) {
          res
            .status(202)
            .json({ msg: "User LogIn Success", token, rToken, user });
        } else {
          res.status(401).json({ msg: "invalid credentials" });
        }
      });
    } else {
      res.status(404).json({ msg: "user does not exit. Signup first!!" });
    }
  } catch (error) {
    res.status(400).json({ err: error.message });
  }
});

//updation
// Access: All
// EndPoint: /users/update/:userId;
// FRONTEND: when user want to update his information;
userRouter.patch("/update/:userId", async (req, res) => {
  const { userId } = req.params;
  const payload = req.body;

  try {
    let insertpayload;
    if (!payload?.password) {
      delete payload.password;
      await UserModel.findByIdAndUpdate({ _id: userId }, payload);
      const user = await UserModel.findOne({ _id: userId });
      res.status(200).json({ msg: "user updated successfully", user });
      return;
    }
    bcrypt.hash(payload.password, 2, async (err, hash) => {
      // Store hash in your password DB.
      if (err) {
        res.status(404).json({ msg: err });
      } else {
        // console.log(hash);
        insertpayload = await { ...payload, password: hash };
      }
      await UserModel.findByIdAndUpdate({ _id: userId }, insertpayload);
      const user = await UserModel.find({ _id: userId });
      res.status(200).json({ msg: "user updated successfully", user });
    });
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

//delete the user ;
// Access: Admin
// EndPoint: /users/delete/:userId;
// FRONTEND: when admin want to delete user/teacher
userRouter.delete("/delete/:userId", auth, async (req, res) => {
  try {
    if (req.body.role == "admin") {
      const { userId } = req.params;
      const deletedUser = await UserModel.find({ _id: userId });
      await UserModel.findByIdAndDelete({ _id: userId });
      res
        .status(200)
        .json({ msg: "user has been deleted", deletedUser: deletedUser });
    } else {
      res.status(401).json({ error: "you don't have access to delete users" });
    }
  } catch (error) {
    res.status(400).json({ msg: error.message });
  }
});

//logout
// Access: All
// EndPoint: /users/logout
// FRONTEND: when users want to logout
userRouter.post("/logout", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const newToken = BlackListModel({ token });
    newToken.save();
    res.status(200).json({ msg: "The user has logged out" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: error.message });
  }
});

// list to courses user purchased
// Access: All
// EndPoint: /users/userCourse/:userId
// FRONTEND: When user want to see his purchased courses

userRouter.get("/userCourse/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await UserModel.findById({ _id: userId }).populate("course");
    // console.log(user.course, userId);
    res.status(200).json({ course: user.course });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Something Went Wrong", error: err.message });
  }
});

// add courseId to the user course array;
// Access: All
// EndPoint: /users/addCourse/:courseId
// FRONTEND: When user have purchased the couse and we have add it to the user course list;

// enrollment flag for the authenticated user (JWT -> req.body.userId)
// EndPoint: GET /users/enrollment/:courseId
userRouter.get("/enrollment/:courseId", auth, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "Invalid course id" });
    }
    const user = await UserModel.findById(req.body.userId).select("course");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const courseOid = new mongoose.Types.ObjectId(courseId);
    const enrolled = user.course.some((cid) => cid.equals(courseOid));
    res.status(200).json({ enrolled });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Something went wrong", error: err.message });
  }
});

userRouter.post("/addCourse/:courseId", auth, async (req, res) => {
  try {
    let id = req.body.userId;
    const courseId = req.params.courseId;
    // check is that course is already present or not;
    await UserModel.findOne({ _id: id, course: { $in: [courseId] } })
      .then(async (course) => {
        //console.log(course);
        if (course) {
          res
            .status(400)
            .json({ error: "You already have Suscribed the Course" });
        } else {
          let user = await UserModel.findByIdAndUpdate(id, {
            $push: { course: courseId },
          });
          res
            .status(201)
            .json({ message: "You have Suscribe the Course", user });
        }
      })
      .catch((error) => {
        console.error("Error checking course:", error);
      });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Something Went Wrong", error: err.message });
  }

});



userRouter.get("/Teachme/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find the user by ID
    const user = await UserModel.findById(userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === 'teacher' || user.role === 'admin') {
      return res.status(400).json({ message: "User is already a teacher or admin" });
    }

    // Update the user's teacherRequestStatus to "pending"
    user.teacherRequestStatus = "pending";
    await user.save();

    res.status(200).json({
      message: "Teacher request submitted successfully. Waiting for admin approval.",
      user,
    });
  } catch (err) {
    // Handle errors
    res.status(400).json({ message: "Something went wrong", error: err.message });
  }
});

// Admin: Get all pending teacher requests
userRouter.get("/teacher-requests", auth, async (req, res) => {
  try {
    if (req.body.role === "admin") {
      const pendingRequests = await UserModel.find({ teacherRequestStatus: "pending" });
      res.status(200).json({ requests: pendingRequests });
    } else {
      res.status(401).json({ error: "You don't have access to this resource" });
    }
  } catch (err) {
    res.status(400).json({ message: "Something went wrong", error: err.message });
  }
});

// Admin: Approve teacher request
userRouter.post("/teacher-requests/approve/:userId", auth, async (req, res) => {
  try {
    if (req.body.role === "admin") {
      const userId = req.params.userId;
      const user = await UserModel.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.role = "teacher";
      user.teacherRequestStatus = "approved";
      await user.save();

      res.status(200).json({ message: "Request approved", user });
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  } catch (err) {
    res.status(400).json({ message: "Something went wrong", error: err.message });
  }
});

// Admin: Reject teacher request
userRouter.post("/teacher-requests/reject/:userId", auth, async (req, res) => {
  try {
    if (req.body.role === "admin") {
      const userId = req.params.userId;
      const user = await UserModel.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.teacherRequestStatus = "rejected";
      await user.save();

      res.status(200).json({ message: "Request rejected", user });
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  } catch (err) {
    res.status(400).json({ message: "Something went wrong", error: err.message });
  }
});




// Get enrolled course IDs for the current user
userRouter.get("/enrolled-courses", auth, async (req, res) => {
  try {
    const user = await UserModel.findById(req.body.userId).select("course");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ enrolledCourseIds: user.course || [] });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
});

module.exports = {
  userRouter,
};
