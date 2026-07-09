import { Router } from "express";
import { upload } from "../middleware/multerUpload";
import { validateCSVUpload } from "../validators/importValidator";
import { importCSV, healthCheck } from "../controllers/importController";

const router = Router();

router.get("/health", healthCheck);
router.post("/import", upload.single("file"), validateCSVUpload, importCSV);

export default router;
