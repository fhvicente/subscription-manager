// Export all middlewares
import authMiddleware, { config } from "./auth.js";

export { authMiddleware, config };

export default authMiddleware;