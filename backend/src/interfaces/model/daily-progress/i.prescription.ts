import { ObjectId } from 'mongoose';
import { IUser } from '../../../models/user.model';
import { IPatient } from '../patient/i.patient';
import { IPrescriptionMedicine } from './i.prescription.medicine';
import { IPatientAdmissionHistory } from '../patient/i.patient.admission.history';

export interface IPrescription {
  patientId?: ObjectId | IPatient;
  patientAdmissionHistoryId?: ObjectId | IPatientAdmissionHistory;
  noteDateTime?: Date;
  doctorId: ObjectId | IUser;

  medicinesInfo?: IPrescriptionMedicine[];

  createdBy?: ObjectId | IUser;
  updatedBy?: ObjectId | IUser;
  createdAt?: Date;
}
