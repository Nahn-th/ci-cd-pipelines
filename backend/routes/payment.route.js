const express = require("express");
const { auth } = require("../middlewares/users.middleware");
const { UserModel } = require("../models/users.models");
const mongoose = require("mongoose");

const paymentRoute = express.Router();

paymentRoute.use(auth);

// POST /payment/momo/create
// Creates a MoMo payment request and returns QR code as a Base64 PNG
paymentRoute.post("/momo/create", async (req, res) => {
  try {
    const { courseId, amount } = req.body;

    if (!courseId || !amount) {
      return res.status(400).json({ message: "Missing courseId or amount" });
    }

    // Build MoMo payment data
    const partnerCode = "MOMO";
    const accessKey = "F8BBA842ECF85";
    const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
    const orderInfo = `Thanh toán khóa học - ${courseId}`;
    const redirectUrl = "https://webhook.site/b3088ad8-f77b-4eef-83cf-ee4e8d419c8b";
    const ipnUrl = "https://webhook.site/b3088ad8-f77b-4eef-83cf-ee4e8d419c8b";
    const requestType = "captureWallet";
    const extraData = "";
    const orderGroupId = "";
    const autoCapture = true;
    const lang = "vi";

    // Tạo orderId & requestId
    const orderId = partnerCode + new Date().getTime();
    const requestId = orderId;

    // Raw signature
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    // HmacSHA256 signature
    const crypto = require("crypto");
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const requestBody = JSON.stringify({
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang,
      autoCapture,
      orderGroupId,
    });

    // Send request to MoMo API
    const https = require("https");
    const options = {
      hostname: "test-payment.momo.vn",
      port: 443,
      path: "/v2/gateway/api/create",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody),
      },
    };

    const momoReq = https.request(options, (momoRes) => {
      let data = "";
      momoRes.on("data", (chunk) => {
        data += chunk;
      });
      momoRes.on("end", () => {
        const result = JSON.parse(data);
        if (result.resultCode === 0) {
          // Store payment info temporarily (in production use DB)
          // Return QR code URL and deeplink to frontend
          res.status(200).json({
            message: "Payment created successfully",
            payUrl: result.payUrl,
            qrCodeUrl: result.qrCodeUrl,
            deeplink: result.deeplink,
            orderId: result.orderId,
            requestId: result.requestId,
            amount: result.amount,
          });
        } else {
          res.status(400).json({
            message: "Payment creation failed",
            momoMessage: result.message,
            resultCode: result.resultCode,
          });
        }
      });
    });

    momoReq.on("error", (err) => {
      console.error("MoMo request error:", err);
      res.status(500).json({ message: "Internal server error", error: err.message });
    });

    momoReq.write(requestBody);
    momoReq.end();
  } catch (err) {
    console.error("MoMo create error:", err);
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
});

// POST /payment/momo/simulate
// For demo/testing: Simulate a successful MoMo payment and enroll the user
paymentRoute.post("/momo/simulate", async (req, res) => {
  try {
    const { courseId, amount } = req.body;

    if (!courseId || !amount) {
      return res.status(400).json({ message: "Missing courseId or amount" });
    }

    const userId = req.body.userId;

    // Check if already enrolled
    const user = await UserModel.findOne({
      _id: userId,
      course: { $in: [courseId] },
    });

    if (user) {
      return res.status(400).json({ error: "You already have Subscribed the Course" });
    }

    // Enroll the user
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $push: { course: courseId } },
      { new: true }
    );

    res.status(201).json({
      message: "Payment successful! You have subscribed to the Course",
      user: updatedUser,
    });
  } catch (err) {
    console.error("MoMo simulate error:", err);
    res.status(500).json({ message: "Something went wrong", error: err.message });
  }
});

module.exports = { paymentRoute };