const jwt = require("jsonwebtoken");
const { blacklist } = require("../blacklist");

const auth = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (token) {
    try {
      if (blacklist.includes(token)) {
        return res.status(401).json({ msg: "Please Login Again" });
      }
      const decoded = jwt.verify(token, "SRM");
      if (decoded) {
        req.body.username = decoded.user;
        req.body.userId = decoded.userId;
        req.body.role = decoded.role;

        req.user = decoded;
        req.userId = decoded.userId;
        req.role = decoded.role;
        next();
      } else {
        return res.status(401).json({ msg: "not authorized" });
      }
    } catch (error) {
      return res.status(400).json({ msg: error.message });
    }
  } else {
    return res.status(401).json({ msg: "Please Login" });
  }
};

module.exports = {
  auth,
}
