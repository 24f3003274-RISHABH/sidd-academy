import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Note from '../models/Note.model.js';
import { AppError, sendSuccess } from '../utils/apiResponse.js';
import { mockData } from '../data/mockStore.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const getAllNotes = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
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

      return sendSuccess(res, 200, 'Notes fetched successfully', { notes });
    }

    // In-memory fallback
    const notes = mockData.notes.filter(n => n.isPublished).map(n => {
      const copy = { ...n };
      const isPaid = !copy.isFree;
      let hasPurchased = false;
      if (req.user) {
        hasPurchased = req.user.role === 'admin' || (req.user.purchasedNotes && req.user.purchasedNotes.includes(copy._id.toString()));
      }
      if (isPaid && !hasPurchased) {
        delete copy.fileUrl;
      }
      return copy;
    });

    return sendSuccess(res, 200, 'Notes fetched successfully', { notes });
  } catch (error) {
    next(error);
  }
};

export const getNoteById = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const note = await Note.findById(req.params.id).lean();
      if (!note) {
        throw new AppError('Note not found', 404);
      }
      return sendSuccess(res, 200, 'Note metadata fetched successfully', { note });
    }

    const note = mockData.notes.find(n => n._id === req.params.id);
    if (!note) {
      throw new AppError('Note not found', 404);
    }
    return sendSuccess(res, 200, 'Note metadata fetched successfully', { note });
  } catch (error) {
    next(error);
  }
};

export const downloadNote = async (req, res, next) => {
  try {
    let note;
    if (mongoose.connection.readyState === 1) {
      note = await Note.findById(req.params.id);
    } else {
      note = mockData.notes.find(n => n._id === req.params.id);
    }

    if (!note) {
      throw new AppError('Note not found', 404);
    }
    if (!note.isFree) {
      const hasPurchased = req.user && (req.user.role === 'admin' || (req.user.purchasedNotes && req.user.purchasedNotes.includes(note._id.toString())));
      if (!hasPurchased) {
        throw new AppError('Access denied. Please purchase the note to download.', 403);
      }
    }
    
    note.downloadCount = (note.downloadCount || 0) + 1;
    if (mongoose.connection.readyState === 1) {
      await note.save();
    }
    
    // If it's a web URL (e.g. sample PDF URL), redirect or serve
    if (note.fileUrl && (note.fileUrl.startsWith('http://') || note.fileUrl.startsWith('https://'))) {
      return res.redirect(note.fileUrl);
    }

    const filePath = path.join(process.cwd(), note.fileUrl || '');
    if (fs.existsSync(filePath)) {
      return res.download(filePath, note.fileName || 'note.pdf');
    }

    // Default sample PDF download fallback
    return res.redirect('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
  } catch (error) {
    next(error);
  }
};

export const createNote = async (req, res, next) => {
  try {
    const fileUrl = req.file ? `/uploads/notes/${req.file.filename}` : req.body.fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    
    const noteData = {
      ...req.body,
      isFree: req.body.isFree === 'true' || req.body.isFree === true,
      price: req.body.price ? Number(req.body.price) : 0,
      fileUrl,
      fileName: req.file ? req.file.originalname : 'note.pdf',
      fileSize: req.file ? req.file.size : 1024 * 1024,
    };
    
    if (mongoose.connection.readyState === 1) {
      const note = await Note.create(noteData);
      return sendSuccess(res, 201, 'Note created successfully', { note });
    }

    const newNote = {
      _id: `note_${Date.now()}`,
      ...noteData,
      isPublished: true,
      downloadCount: 0,
      createdAt: new Date(),
    };
    mockData.notes.unshift(newNote);
    return sendSuccess(res, 201, 'Note created successfully', { note: newNote });
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    delete updateData.fileUrl; // Prevent updating file URL here
    if (mongoose.connection.readyState === 1) {
      const note = await Note.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
      if (!note) {
        throw new AppError('Note not found', 404);
      }
      return sendSuccess(res, 200, 'Note updated successfully', { note });
    }

    const idx = mockData.notes.findIndex(n => n._id === req.params.id);
    if (idx === -1) throw new AppError('Note not found', 404);
    mockData.notes[idx] = { ...mockData.notes[idx], ...updateData };
    return sendSuccess(res, 200, 'Note updated successfully', { note: mockData.notes[idx] });
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
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
      return sendSuccess(res, 200, 'Note deleted successfully');
    }

    const idx = mockData.notes.findIndex(n => n._id === req.params.id);
    if (idx === -1) throw new AppError('Note not found', 404);
    mockData.notes.splice(idx, 1);
    return sendSuccess(res, 200, 'Note deleted successfully');
  } catch (error) {
    next(error);
  }
};

