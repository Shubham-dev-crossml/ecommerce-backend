const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const controller = require("./controller");
const validate = require("../../middleware/validate");
const authenticate = require("../../middleware/authenticate");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("./schema");

// stricter rate limit on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  message: {
    success: false,
    message: "Too many attempts, please try again later.",
  },
});
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  controller.register,
);
router.get("/verify-email", controller.verifyEmail);
router.post("/login", authLimiter, validate(loginSchema), controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  controller.forgotPassword,
);
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  controller.resetPassword,
);
router.get("/me", authenticate, controller.getMe);

module.exports = router;
