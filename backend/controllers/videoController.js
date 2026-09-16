const path = require('path');

exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file provided' });
    }

    const relativePath = `/uploads/${req.file.filename}`;
    const absolutePath = req.file.path;

    res.status(201).json({
      message: 'Video uploaded successfully',
      filename: req.file.filename,
      videoPath: absolutePath,
      videoUrl: relativePath,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ message: 'Failed to upload video' });
  }
};
