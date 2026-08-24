import fs from 'fs';
import path from 'path';
import Note from '../models/Note.model.js';
import { AppError, sendSuccess } from '../utils/apiResponse.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getAllNotes = async (req, res, next) => {
  try {
    let notes = await Note.find({ isPublished: true }).sort({ createdAt: -1 }).lean();
    
    notes = notes.map((note) => {
      const isPaid = !note.isFree;
      let hasPurchased = false;
      if (req.user) {
         hasPurchased = req.user.role === 'admin' || (req.user.purchasedNotes && req.user.purchasedNotes.includes(note._id.toString()));
      }
      if (isPaid && !hasPurchased) {
        delete note.fileUrl;
      }
      return note;
    });

    sendSuccess(res, 200, 'Notes fetched successfully', { notes });
  } catch (error) {
    next(error);
  }
};

export const getNoteById = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id).lean();
    if (!note) {
      throw new AppError('Note not found', 404);
    }
    sendSuccess(res, 200, 'Note metadata fetched successfully', { note });
  } catch (error) {
    next(error);
  }
};

export const downloadNote = async (req, res, next) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      throw new AppError('Note not found', 404);
    }
    if (!note.isFree) {
      const hasPurchased = req.user.role === 'admin' || (req.user.purchasedNotes && req.user.purchasedNotes.includes(note._id.toString()));
      if (!hasPurchased) {
        throw new AppError('Access denied. Please purchase the note to download.', 403);
      }
    }
    
    note.downloadCount += 1;
    await note.save();
    
    const filePath = path.join(process.cwd(), note.fileUrl);
    if (!fs.existsSync(filePath)) {
      throw new AppError('File not found on server', 404);
    }
    
    res.download(filePath, note.fileName || 'note.pdf');
  } catch (error) {
    next(error);
  }
};

export const createNote = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('Please upload a file', 400);
    }
    
    const noteData = {
      ...req.body,
      fileUrl: `/uploads/notes/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size
    };
    
    const note = await Note.create(noteData);
    sendSuccess(res, 201, 'Note created successfully', { note });
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    delete updateData.fileUrl; // Prevent updating file URL here
    const note = await Note.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!note) {
      throw new AppError('Note not found', 404);
    }
    sendSuccess(res, 200, 'Note updated successfully', { note });
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) {
      throw new AppError('Note not found', 404);
    }
    try {
      if (note.fileUrl) {
         const filePath = path.join(process.cwd(), note.fileUrl);
         if (fs.existsSync(filePath)) {
           fs.unlinkSync(filePath);
         }
      }
    } catch (err) {
      console.error('Failed to delete note file:', err);
    }
    sendSuccess(res, 200, 'Note deleted successfully');
  } catch (error) {
    next(error);
  }
};
