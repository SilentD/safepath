export default function requireUser(req, res, next) {
  // A trusted authentication middleware must set req.user first.
  if (!req.user || !(req.user.id ?? req.user._id)) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  return next();
}
