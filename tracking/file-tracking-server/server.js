const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Serve uploaded files statically with proper headers for PDFs
app.use(
  "/uploads",
  express.static(uploadsDir, {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === ".pdf") {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "inline");
      }
    },
  })
);

mongoose
  .connect("mongodb://127.0.0.1:27017/trackingDB")
  .then(() => console.log("Connected to MongoDB!"))
  .catch((err) => console.error("MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: String,
  name: String,
  department: String,
});
const User = mongoose.model("User", userSchema);

// Submission Schema (defined once)
const submissionSchema = new mongoose.Schema({
  folderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  username: { type: String, required: true },
  fileName: String,
  filePath: String, // Path to the uploaded file
  fileType: String, // MIME type of the file
  notes: String,
  submittedAt: { type: Date, default: Date.now },
});
const Submission = mongoose.model("Submission", submissionSchema);

// Optimized dynamic model function to handle spaces and prevent crashes
const getFolderModel = (department) => {
  const cleanDept = department.replace(/\s+/g, "_").toLowerCase();
  const modelName = `${cleanDept}_folders`;

  if (mongoose.models[modelName]) return mongoose.models[modelName];

  const folderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    deadline: Date,
    createdBy: String,
    createdAt: { type: Date, default: Date.now },
  });

  return mongoose.model(modelName, folderSchema, modelName);
};

// --- ROUTES ---

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Username and password required" });
    }

    const user = await User.findOne({ username, password });

    if (user) {
      return res.json({ success: true, user });
    } else {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/create-folder", async (req, res) => {
  const { name, description, deadline, createdBy, department } = req.body;
  try {
    const FolderModel = getFolderModel(department);
    const newFolder = new FolderModel({
      name,
      description,
      deadline,
      createdBy,
    });
    await newFolder.save();
    res.json({ success: true, folder: newFolder });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/folders/:department", async (req, res) => {
  try {
    const FolderModel = getFolderModel(req.params.department);
    const folders = await FolderModel.find().sort({ createdAt: -1 });
    res.json({ success: true, folders });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

app.delete("/delete-folder/:department/:id", async (req, res) => {
  try {
    const FolderModel = getFolderModel(req.params.department);
    await FolderModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});

// Update folder (PUT method)
app.put("/update-folder/:department/:id", async (req, res) => {
  try {
    console.log("Update folder request (PUT):", {
      params: req.params,
      body: req.body,
    });
    const { name, description, deadline } = req.body;
    const FolderModel = getFolderModel(req.params.department);
    const updated = await FolderModel.findByIdAndUpdate(
      req.params.id,
      { name, description, deadline },
      { new: true }
    );
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, error: "Folder not found" });
    }
    res.json({ success: true, folder: updated });
  } catch (error) {
    console.error("Update folder error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update folder (POST method - backup)
app.post("/update-folder/:department/:id", async (req, res) => {
  try {
    console.log("Update folder request (POST):", {
      params: req.params,
      body: req.body,
    });
    const { name, description, deadline } = req.body;
    const FolderModel = getFolderModel(req.params.department);
    const updated = await FolderModel.findByIdAndUpdate(
      req.params.id,
      { name, description, deadline },
      { new: true }
    );
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, error: "Folder not found" });
    }
    res.json({ success: true, folder: updated });
  } catch (error) {
    console.error("Update folder error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit File Route (defined once)
app.post("/submit-file", upload.single("file"), async (req, res) => {
  try {
    console.log("File upload request received");
    console.log("Request body:", req.body);
    console.log(
      "Request file:",
      req.file
        ? {
            name: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
          }
        : "No file"
    );

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, error: "No file uploaded" });
    }

    const { folderId, username, notes } = req.body;
    
    // Check if submission already exists for this folder and user
    let existingSubmission = await Submission.findOne({
      folderId,
      username,
    });

    if (existingSubmission) {
      // Delete old file if it exists
      if (existingSubmission.filePath) {
        const oldFilePath = path.join(uploadsDir, existingSubmission.filePath);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      // Update existing submission
      existingSubmission.fileName = req.file.originalname;
      existingSubmission.filePath = req.file.filename;
      existingSubmission.fileType = req.file.mimetype;
      existingSubmission.notes = notes || "";
      existingSubmission.submittedAt = new Date();
      await existingSubmission.save();
      
      console.log("File updated successfully:", existingSubmission.filePath);
      res.json({
        success: true,
        message: "File updated successfully!",
        submission: existingSubmission,
      });
    } else {
      // Create new submission
      const newSubmission = new Submission({
        folderId,
        username,
        fileName: req.file.originalname,
        filePath: req.file.filename,
        fileType: req.file.mimetype,
        notes,
      });
      await newSubmission.save();
      console.log("File saved successfully:", newSubmission.filePath);
      res.json({
        success: true,
        message: "File submitted successfully!",
        submission: newSubmission,
      });
    }
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get User Submissions
app.get("/user-submissions/:username", async (req, res) => {
  try {
    const submissions = await Submission.find({
      username: req.params.username,
    });
    res.json({ success: true, submissions });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all semi-admin departments (for Admin dashboard)
app.get("/semiadmin-departments", async (req, res) => {
  try {
    const semiAdmins = await User.find({ role: "semi-admin" });
    // Get unique departments
    const departments = [
      ...new Set(semiAdmins.map((user) => user.department).filter(Boolean)),
    ];
    res.json({ success: true, departments });
  } catch (error) {
    console.error("Error fetching semi-admin departments:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all users (for Admin management)
app.get("/all-users", async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ["semi-admin", "user"] } })
      .select("-password")
      .sort({ role: 1, department: 1 });
    res.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create user (Admin only)
app.post("/create-user", async (req, res) => {
  try {
    const { username, password, name, role, department } = req.body;

    // Validation
    if (!username || !password || !name || !role || !department) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required" });
    }

    if (role !== "semi-admin" && role !== "user") {
      return res.status(400).json({ success: false, error: "Invalid role" });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, error: "Username already exists" });
    }

    const newUser = new User({
      username,
      password,
      name,
      role,
      department,
    });

    await newUser.save();
    res.json({
      success: true,
      user: { ...newUser.toObject(), password: undefined },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all unique departments (for dropdown selection)
app.get("/departments", async (req, res) => {
  try {
    const users = await User.find({ department: { $exists: true, $ne: null } });
    const departments = [
      ...new Set(users.map((user) => user.department).filter(Boolean)),
    ];
    res.json({ success: true, departments });
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Submissions for a Folder
app.get("/folder-submissions/:folderId", async (req, res) => {
  try {
    const submissions = await Submission.find({
      folderId: req.params.folderId,
    });
    // Add file URL to each submission
    const baseUrl = `http://${req.get("host")}`;
    const submissionsWithUrls = submissions.map((submission) => ({
      ...submission.toObject(),
      fileUrl: submission.filePath
        ? `${baseUrl}/uploads/${submission.filePath}`
        : null,
    }));
    res.json({ success: true, submissions: submissionsWithUrls });
  } catch (error) {
    console.error("Error fetching folder submissions:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download/View file endpoint
app.get("/file/:filePath", (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filePath);
  if (fs.existsSync(filePath)) {
    // Set proper headers for PDF viewing
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'inline; filename="' + path.basename(filePath) + '"'
      );
    }
    res.sendFile(filePath);
  } else {
    res.status(404).json({ success: false, error: "File not found" });
  }
});

// Get a specific user submission for a folder
app.get("/submission/:folderId/:username", async (req, res) => {
  try {
    const submission = await Submission.findOne({
      folderId: req.params.folderId,
      username: req.params.username,
    });
    if (submission) {
      const baseUrl = `http://${req.get("host")}`;
      const submissionWithUrl = {
        ...submission.toObject(),
        fileUrl: submission.filePath
          ? `${baseUrl}/uploads/${submission.filePath}`
          : null,
      };
      res.json({ success: true, submission: submissionWithUrl });
    } else {
      res.json({ success: true, submission: null });
    }
  } catch (error) {
    console.error("Error fetching submission:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unsubmit/Delete a submission
app.post("/unsubmit-file", async (req, res) => {
  try {
    const { folderId, username } = req.body;
    
    if (!folderId || !username) {
      return res.status(400).json({
        success: false,
        error: "folderId and username are required",
      });
    }

    const submission = await Submission.findOneAndDelete({
      folderId,
      username,
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: "Submission not found",
      });
    }

    // Delete the file from the uploads directory
    if (submission.filePath) {
      const filePath = path.join(uploadsDir, submission.filePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.json({ success: true, message: "Submission deleted successfully" });
  } catch (error) {
    console.error("Error deleting submission:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 404 -> return JSON instead of HTML
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Not found" });
});

// Error handler -> return JSON
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  res
    .status(500)
    .json({ success: false, error: err.message || "Server error" });
});

app.listen(3000, () => console.log("Server running on port 3000"));
