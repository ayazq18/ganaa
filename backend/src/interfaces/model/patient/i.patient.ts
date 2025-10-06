import mongoose, { ObjectId } from 'mongoose';
import IGender from '../../i_gender';
import { IUser } from '../../../models/user.model';
import { IReferredType } from '../dropdown/i.referredType';
export interface IPatient extends mongoose.Document {
  // Patient Details
  uhid?: number;
  firstName?: string;
  lastName?: string;
  dob?: Date;
  age?: number;
  email?: string;
  phoneNumberCountryCode?: string;
  phoneNumber?: string;
  alternativephoneNumberCountryCode?: string;
  alternativeMobileNumber?: string;
  gender?: IGender;
  identificationMark?: string;
  country: string;
  fullAddress: string;
  patientPic: string;
  patientPicUrl?: string;
  patientPicFileName: string;
  patientidProofUrl?: string;
  idProof: string;
  patientIdProofName: string;

  // Reference
  referredTypeId: ObjectId | IReferredType;
  referralDetails: string;

  // Demographics
  education: string;
  area: 'Urban' | 'Rural';
  familyIncome: string;
  religion: string;
  language: string;
  isMarried: boolean;
  numberOfChildren: number;
  occupation: string;
  personalIncome?: string;

  createdBy?: ObjectId | IUser;
  updatedBy?: ObjectId | IUser;

  createdAt: Date;
}
