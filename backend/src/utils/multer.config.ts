import { FileFilterCallback } from 'multer';
import AppError from './appError';
import { UserRequest } from '../interfaces/extra/i_extended_class';

export class MFileFilter {
  // Utility function to check file validity
  private static isValidFile(file: Express.Multer.File, allowedMimeTypes: string[]): boolean {
    return allowedMimeTypes.some((mimeType) => file.mimetype.startsWith(mimeType));
  }

  // Main file filter builder function
  private static buildFileFilter({
    allowedMimeTypes,
    errorMessage,
  }: {
    allowedMimeTypes: string[];
    errorMessage: string;
  }) {
    return (req: UserRequest, file: Express.Multer.File, cb: FileFilterCallback) => {
      if (!req.user) return cb(new AppError('User is not authenticated', 401));

      if (MFileFilter.isValidFile(file, allowedMimeTypes)) {
        cb(null, true);
      } else {
        cb(new AppError(errorMessage, 400));
      }
    };
  }

  // For only images & pdf
  static imageAndPdfFilter = MFileFilter.buildFileFilter({
    allowedMimeTypes: ['image/', 'application/pdf'],
    errorMessage: 'Only Image or PDF files are supported',
  });

  // For only images
  static imageFilter = MFileFilter.buildFileFilter({
    allowedMimeTypes: ['image/'],
    errorMessage: 'Only Image files are supported',
  });

  // For only PDF files
  static pdfFilter = MFileFilter.buildFileFilter({
    allowedMimeTypes: ['application/pdf'],
    errorMessage: 'Only PDF files are supported',
  });

  // Inside MFileFilter class
static patientPicAndAdmissionFilesFilter = (req: UserRequest, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (!req.user) return cb(new AppError('User is not authenticated', 401));
  console.log("hii")

  if (file.fieldname === 'patientPic') {
    // Only images for patientPic
    if (file.mimetype.startsWith('image/')) {
      return cb(null, true);
    } else {
      return cb(new AppError('Only Image files are supported for profile picture', 400));
    }
  } else if (file.fieldname === 'admissionIdProofFiles') {
    // Images + PDFs for admission files
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    } else {
      return cb(new AppError('Only Image or PDF files are supported for admission proof', 400));
    }
  } else {
    // Unknown field
    return cb(new AppError('Unexpected file field', 400));
  }
};

}
