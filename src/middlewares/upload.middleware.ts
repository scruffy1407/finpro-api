import multer from "multer";
import path from "path";

class InvalidFileTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidFileTypeError";
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const destinationPath = path.join(__dirname, "../uploads/");
    cb(null, destinationPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()} - ${file.originalname}`);
  },
});

const validateFileType = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  console.log(file);
  console.log(path.extname(file.originalname));
  const allowedExtensions = [".png", ".jpg", ".jpeg"];
  const extname = path.extname(file.originalname).toLowerCase();
  if (!allowedExtensions.includes(extname)) {
    const err: any = new InvalidFileTypeError(
      "Invalid file type. Only PNG and JPG allowed."
    );
    return cb(err, false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // batas ukuran file max 2MB,
  },
  fileFilter: validateFileType,
});

export default upload;
