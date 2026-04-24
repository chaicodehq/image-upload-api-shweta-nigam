import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Image } from "../models/image.model.js";
import { generateThumbnail, getImageDimensions } from "../utils/thumbnail.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * TODO: Upload image
 *
 * 1. Check if file uploaded (if !req.file, return 400 "No file uploaded")
 * 2. Get file info from req.file (filename, originalname, mimetype, size)
 * 3. Get image dimensions using getImageDimensions(filepath)
 * 4. Generate thumbnail using generateThumbnail(filename)
 * 5. Extract optional fields from req.body (description, tags)
 *    - Parse tags: split by comma and trim each tag
 * 6. Save metadata to database (Image.create)
 * 7. Return 201 with image metadata
 */
export async function uploadImage(req, res, next) {
  try {
    // Your code here
    if (req.fileValidationError) {
      return res.status(400).json({
        error: { message: req.fileValidationError },
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: { message: "No file uploaded" } });
    }

    const { filename, originalname, mimetype, size } = req.file;

    const filepath = path.join(__dirname, "../../uploads", filename);

    const { width, height } = await getImageDimensions(filepath);

    const thumbnailFilename = await generateThumbnail(filename);

    let { description, tags } = req.body;

    let parsedTags = [];
    if (tags) {
      parsedTags = tags.split(",").map((tag) => tag.trim());
    }

    const image = await Image.create({
      filename,
      originalName: originalname, // To preserve the user’s original file name
      mimetype,
      size,
      width,
      height,
      thumbnailFilename,
      description: description || "",
      tags: parsedTags,
    });

    return res.status(201).json(image);
  } catch (error) {
    next(error);
  }
}

/**
 * TODO: List images with pagination and filtering
 *
 * 1. Extract query parameters:
 *    - page (default 1)
 *    - limit (default 10, max 50)
 *    - search (search in originalName and description)
 *    - mimetype (filter by mimetype)
 *    - sortBy (field to sort by, default 'uploadDate')
 *    - sortOrder (asc or desc, default 'desc')
 *
 * 2. Build MongoDB query:
 *    - Add text search if search parameter provided
 *    - Add mimetype filter if provided
 *
 * 3. Calculate pagination:
 *    - skip = (page - 1) * limit
 *    - total = await Image.countDocuments(query)
 *    - pages = Math.ceil(total / limit)
 *
 * 4. Fetch images with sorting and pagination:
 *    - Image.find(query).sort({[sortBy]: sortOrder === 'asc' ? 1 : -1}).skip(skip).limit(limit)
 *
 * 5. Calculate totalSize (sum of all image sizes)
 *
 * 6. Return 200 with:
 *    - data: images array
 *    - meta: { total, page, limit, pages, totalSize }
 */
export async function listImages(req, res, next) {
  try {
    // Your code here
    let {
      page = 1,
      limit = 10,
      search,
      mimetype,
      sortBy = "uploadDate",
      sortOrder = "desc",
    } = req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    limit = Math.min(limit, 50);

    const query = {}; // This will store filters for MongoDB

    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (mimetype) {
      query.mimetype = mimetype;
    }

    const skip = (page - 1) * limit;

    const total = await Image.countDocuments(query);
    const pages = Math.ceil(total / limit);

    const images = await Image.find(query)
      .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit);

    const totalSize = images.reduce((sum, img) => sum + img.size, 0);

    return res.status(200).json({
      data: images,
      meta: { total, page, limit, pages, totalSize },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * TODO: Get image metadata by ID
 *
 * 1. Find image by req.params.id
 * 2. If not found: return 404 "Image not found"
 * 3. Return 200 with image metadata
 */
export async function getImage(req, res, next) {
  try {
    // Your code here
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ error: { message: "Image not found" } });
    }

    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({ error: { message: "Image not found" } });
    }

    return res.status(200).json(image);
  } catch (error) {
    next(error);
  }
}

/**
 * TODO: Download original image
 *
 * 1. Find image by req.params.id
 * 2. If not found: return 404 "Image not found"
 * 3. Construct file path
 * 4. Check if file exists using fs.existsSync()
 * 5. If file missing: return 404 "File not found"
 * 6. Set headers:
 *    - Content-Type: image.mimetype
 *    - Content-Disposition: attachment; filename="originalName"
 * 7. Send file using res.sendFile(filepath)
 */
export async function downloadImage(req, res, next) {
  try {
    // Your code here
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ error: { message: "id is required" } });
    }

    const image = await Image.findById(id);

    if (!image) {
      return res.status(404).json({ error: { message: "Image not found" } });
    }

    const filePath = path.join(__dirname, "../../uploads", image.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: { message: "File not found" } });
    }

    res.setHeader("Content-Type", image.mimetype);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${image.originalName}"`,
    );

    return res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
}

/**
 * TODO: Download thumbnail
 *
 * 1. Find image by req.params.id
 * 2. If not found: return 404 "Image not found"
 * 3. Construct thumbnail path
 * 4. Check if thumbnail exists
 * 5. If missing: return 404 "File not found"
 * 6. Set headers:
 *    - Content-Type: image/jpeg (thumbnails are always JPEG)
 * 7. Send file using res.sendFile(thumbnailPath)
 */
export async function downloadThumbnail(req, res, next) {
  try {
    // Your code here

    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ error: { message: "Image not found" } });
    }

    const thumbnailPath = path.join(
      __dirname,
      "../../uploads/thumbnails",
      image.thumbnailFilename,
    );

    if (!fs.existsSync(thumbnailPath)) {
      return res.status(404).json({ error: { message: "file not found" } });
    }

    res.setHeader("Content-Type", "image/jpeg");

    return res.sendFile(thumbnailPath);
  } catch (error) {
    next(error);
  }
}

/**
 * TODO: Delete image
 *
 * 1. Find image by req.params.id
 * 2. If not found: return 404 "Image not found"
 * 3. Delete original file (use try-catch, ignore ENOENT errors)
 * 4. Delete thumbnail (use try-catch, ignore ENOENT errors)
 * 5. Delete metadata from database
 * 6. Return 204 (no content)
 */
export async function deleteImage(req, res, next) {
  try {
    // Your code here

    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ error: { message: "Image not found" } });
    }

    const filePath = path.join(__dirname, "../../uploads", image.filename);
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }

    const thumbnailPath = path.join(
      __dirname,
      "../../uploads/thumbnails",
      image.thumbnailFilename,
    );
    try {
      fs.unlinkSync(thumbnailPath);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }

    await Image.findByIdAndDelete(image._id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
