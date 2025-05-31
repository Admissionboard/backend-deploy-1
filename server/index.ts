import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";

const app = express();

// ✅ CORS middleware - must be the very first middleware
app.use(cors({
  origin: "https://www.studyinuk.co", // your frontend domain
  credentials: true,
}));

// ✅ Make sure to allow preflight requests (important for complex requests like POST with headers)
app.options('*', cors({
  origin: "https://www.studyinuk.co",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ⬇ Your custom logger or middleware can stay here
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  // Your logic continues...
});


  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Use PORT from environment (Render) or fallback to 5000 for development
  const port = parseInt(process.env.PORT || "5000");
  server.listen(port, "0.0.0.0", () => {
    console.log(`Backend server running on port ${port}`);
  });
})();
