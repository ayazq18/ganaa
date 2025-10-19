import ExcelJS from 'exceljs';
import mongoose, { ObjectId } from 'mongoose';
import Lead from '../models/lead.model';
import * as S3 from '../utils/s3Helper';
import { random } from '../utils/random';
import { IUser } from '../models/user.model';
import { S3Path } from '../constant/s3.path';
import { IBasicObj } from '../interfaces/generics';
import CommonFile from '../models/common.file.model';
import Patient from '../models/patient/patient.model';
import { ICenter } from '../interfaces/model/resources/i.center';
import { IReferredType } from '../interfaces/model/dropdown/i.referredType';
import { IRelationship } from '../interfaces/model/dropdown/i.relationship';
import PatientAdmissionHistory from '../models/patient/patient.admission.history.model';

export const buildWeeklyReport = async () => {
  // Leads Information
  const leads = await Lead.find();
  const leadsPatientId = leads
    .map((el) => el.patientId?.toString())
    .filter((id) => id !== null && id !== undefined);

  // Leads Patient Information
  const patientsFromLead = await Patient.find({ _id: { $in: leadsPatientId } }).lean();
  let patientFromLeadMap: IBasicObj = {};
  patientsFromLead.map((el) => {
    patientFromLeadMap[el._id.toString()] = el;
  });

  // Rest of Others Patient Information
  const allPatients = await Patient.find({ _id: { $nin: leadsPatientId } }).lean();
  let allPatientIds = allPatients.map((e) => e._id.toString());
  allPatientIds = [...new Set([...allPatientIds, ...leadsPatientId])];
  const allPatientIdMongoDb: any = allPatientIds.map((e) => new mongoose.Types.ObjectId(e));

  // Admission History Data
  const admissionHistoryDocs =
    await PatientAdmissionHistory.getLatestPatientHistory(allPatientIdMongoDb);

  // Build Rows
  let excelRow = leads.map((e) => {
    const patientId = e?.patientId?.toString();
    const patient = patientId ? (patientFromLeadMap[patientId] ?? {}) : {};
    const mergeLead = _mergeLeadFields(patient, e);
    const admissionHistory = patientId ? (admissionHistoryDocs[patientId ?? {}] ?? {}) : {};
    return _buildColumns({ ...mergeLead, ...admissionHistory });
  });
  allPatients.forEach((e) => {
    const patientId = e?._id?.toString();
    const admissionHistory = patientId ? (admissionHistoryDocs[patientId ?? {}] ?? {}) : {};
    excelRow.push(_buildColumns({ ...e, ...admissionHistory }));
  });

  const excelFile = await _buildExcelSheet(excelRow);

  const fileName = `patient_weekly_data_${Date.now()}-${random.randomAlphaNumeric(6)}.xlsx`;
  const filePath = S3Path.commonFiles(fileName);
  try {
    await S3.uploadFile(
      filePath,
      excelFile,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    await CommonFile.create({
      fileName: fileName,
      filePath: filePath,
      fileType: 'WEEKLY_REPORT',
    });
  } catch (err) {
    console.log(err);
  }
};

/**
 * Helper Functions
 */
const _buildExcelSheet = async (data: IBasicObj[]) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Weekly Report');

  // Add header row
  const headers = Object.keys(data[0]);
  const headerRow = worksheet.addRow(headers);

  // Freeze the first row
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  // Add data rows
  data.forEach((row) => {
    worksheet.addRow(headers.map((header) => (row as Record<string, any>)[header]));
  });

  // Style headers
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 14 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'A4C2F4' },
    };
  });

  // Auto-width column
  headers.forEach((header, idx) => {
    const columnData = [
      header,
      ...data.map((row) => ((row as Record<string, any>)[header] ?? '').toString()),
    ];

    const maxWidth = Math.max(...columnData.map((c) => _calculateExcelColumnWidth(c))) + 2;

    worksheet.getColumn(idx + 1).width = maxWidth;
  });

  // const fileName = _buildFileName();
  // await workbook.xlsx.writeFile(fileName);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

const _buildFileName = (): string => {
  const now = new Date();

  const pad = (n: number) => n.toString().padStart(2, '0');

  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  const formattedDate = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  return `weekly_report_${formattedDate}.xlsx`;
};

const _calculateExcelColumnWidth = (str: string): number => {
  if (!str) return 10;

  // Excel default font (Calibri) renders wide chars wider
  const doubleWidth = str.match(/[A-Z0-9]/g)?.length || 0;
  const normalWidth = str.length - doubleWidth;

  // Estimate width: wide chars ~1.2x normal ones
  const estimatedWidth = normalWidth + doubleWidth * 1.2;

  return Math.ceil(estimatedWidth);
};

const _separateDate = (input: string | Date | null | undefined): [string, string] => {
  if (!input) return ['', ''];

  let dateObj: Date;

  try {
    dateObj = typeof input === 'string' ? new Date(input) : input;

    if (isNaN(dateObj.getTime())) return ['', '']; // Invalid date

    const date = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = dateObj.toTimeString().split(' ')[0]; // HH:MM:SS

    return [date, time];
  } catch (err) {
    return ['', ''];
  }
};

const _buildColumns = (data: any) => {
  const [date, time] = _separateDate(data?.leadDateTime);
  const [dob, _] = _separateDate(data?.dob);
  const [centerVisitDate, centerVisitTime] = _separateDate(data?.centerVisitDateTime);
  const [followUpDate] = _separateDate(data?.nextFollowUpDate);
  const [admissionDate] = _separateDate(data?.dateOfAdmission);

  return {
    'Lead Date': date,
    'Lead Time': time,
    Status: data?.status,
    'Lead Type': data?.leadType,
    'New Lead': data?.isNewLead == null ? '' : data?.isNewLead ? 'Yes' : 'No',
    'Lead Select': data?.leadSelect,
    'Progress Status': data?.progressStatus,
    'Referral Type': (data?.referralTypeId as IReferredType)?.name,
    'Referral Details': data?.referralDetails,
    'First Name': data?.firstName,
    'Last Name': data?.lastName,
    DOB: dob,
    Age: data?.age,
    Email: data?.email,
    'Country Code': data?.phoneNumberCountryCode,
    'Phone Number': data?.phoneNumber,
    'Alternate Country Code': data?.alternativephoneNumberCountryCode,
    'Alternate Phone Number': data?.alternativeMobileNumber,
    Gender: data?.gender,
    'Guardian Relationship': (data?.guardianNameRelationshipId as IRelationship)?.fullName,
    'Guardian Name': data?.guardianName,
    Country: data?.country,
    'Full Address': data?.fullAddress,
    'Cheif Complaints': data?.chiefComplaints,
    'Admission Type': `${data?.admissionType ?? ''} -- ${data.involuntaryAdmissionType ?? ''}`,
    'Illness Type': data?.illnessType,
    'Center Vist Date': centerVisitDate,
    'Center Vist Time': centerVisitTime,
    'Center Name': (data?.centerId as ICenter)?.centerName,
    'First Person Contacted At Ganaa': data?.firstPersonContactedAtGanaa,
    'Assigned To': `${(data?.assignedTo as IUser)?.firstName ?? ''} ${(data?.assignedTo as IUser)?.lastName ?? ''}`,
    'Next Follow Up Date': followUpDate,
    UHID: data?.uhid,
    'Identification Mark': data?.identificationMark,
    Education: data?.education,
    Area: data?.area,
    'Family Income': data?.familyIncome,
    Religion: data?.religion,
    Language: data?.language,
    'Is Married': data?.isMarried ? 'Yes' : 'No',
    'Number Of Children': data?.numberOfChildren,
    Occupation: data?.occupation,
    'Personal Income': data?.personalIncome,
    'Date of Admission': admissionDate,
    'Current Status': data?.currentStatus,
    'Application For Admission': _isFileUploaded(
      data?.admissionChecklist,
      'applicationForAdmission'
    ),
    'Voluntary Admission Form': _isFileUploaded(data?.admissionChecklist, 'voluntaryAdmissionForm'),
    'In Voluntary Admission Form': _isFileUploaded(
      data?.admissionChecklist,
      'inVoluntaryAdmissionForm'
    ),
    'Minor Admission Form': _isFileUploaded(data?.admissionChecklist, 'minorAdmissionForm'),
    'Family Declaration': _isFileUploaded(data?.admissionChecklist, 'familyDeclaration'),
    'Section 94': _isFileUploaded(data?.admissionChecklist, 'section94'),
    'Capacity Assessment': _isFileUploaded(data?.admissionChecklist, 'capacityAssessment'),
    'Hospital Guideline Form': _isFileUploaded(data?.admissionChecklist, 'hospitalGuidelineForm'),
    'Finacial Counselling': _isFileUploaded(data?.admissionChecklist, 'finacialCounselling'),
    'Orientation Of Family': _isFileUploaded(data?.admissionChecklist, 'orientationOfFamily'),
    'Orientation Of Patient': _isFileUploaded(data?.admissionChecklist, 'orientationOfPatient'),
    'Is Insured': data?.admissionChecklist?.isInsured ? 'Yes' : 'No',
    'Insured Detail': data?.admissionChecklist?.insuredDetail,
    'Insured File': _isFileUploaded(data?.admissionChecklist, 'insuredFile'),
    'Center Name 2': data?.resourceAllocation?.centerId?.centerName ?? '',
    'Room Type': data?.resourceAllocation?.roomTypeId?.name ?? '',
    'Room Number': data?.resourceAllocation?.roomNumberId?.name ?? '',
    'Locker Number': data?.resourceAllocation?.lockerNumberId?.name ?? '',
    'Belongings In Locker': data?.resourceAllocation?.belongingsInLocker ?? '',
    'Assigned Doctor': `${data?.resourceAllocation?.assignedDoctorId?.firstName ?? ''} ${data?.resourceAllocation?.assignedDoctorId?.lastName ?? ''}`,
    'Assigned Therapist': `${data?.resourceAllocation?.assignedTherapistId?.firstName ?? ''} ${data?.resourceAllocation?.assignedDoctorId?.lastName ?? ''}`,
    Nurse: data?.resourceAllocation?.nurse ?? '',
    'Care Staff': data?.resourceAllocation?.careStaff ?? '',
    Allergies: data?.allergiesNames?.map((e: IBasicObj) => e.name).join(', '),
    'Diabetic Status': data?.diabeticStatus ?? '',
    'Hyper Tension': data?.diabeticStatus ?? '',
    'Heart Disease': data?.heartDisease ?? '',
    'Heart Description': data?.heartDiseaseDescription ?? '',
    'Level Of Risk': data?.levelOfRisk ?? '',
    'Level Of Risk Description': data?.levelOfRiskDescription ?? '',
  };
};

const _isFileUploaded = (data: IBasicObj, key: string) => {
  if (data?.hasOwnProperty(key)) {
    return data[key].length > 0 ? 'Yes' : 'No';
  } else {
    return 'No';
  }
};

const _mergeLeadFields = (primary: any = {}, fallback: any = {}) => {
  const get = (val: any) => (val === undefined || val === null || val === '' ? undefined : val);

  return {
    leadDateTime: get(primary.leadDateTime) ?? fallback.leadDateTime,
    status: get(primary.status) ?? fallback.status,
    leadType: get(primary.leadType) ?? fallback.leadType,
    isNewLead: primary.isNewLead == null ? fallback.isNewLead : primary.isNewLead,
    leadSelect: get(primary.leadSelect) ?? fallback.leadSelect,
    progressStatus: get(primary.progressStatus) ?? fallback.progressStatus,
    referralTypeId: get(primary.referralTypeId) ? primary.referralTypeId : fallback.referralTypeId,
    referralDetails: get(primary.referralDetails) ?? fallback.referralDetails,
    firstName: get(primary.firstName) ?? fallback.firstName,
    lastName: get(primary.lastName) ?? fallback.lastName,
    dob: get(primary.dob) ?? fallback.dob,
    age: get(primary.age) ?? fallback.age,
    email: get(primary.email) ?? fallback.email,
    phoneNumberCountryCode: get(primary.phoneNumberCountryCode) ?? fallback.phoneNumberCountryCode,
    phoneNumber: get(primary.phoneNumber) ?? fallback.phoneNumber,
    alternativephoneNumberCountryCode:
      get(primary.alternativephoneNumberCountryCode) ?? fallback.alternativephoneNumberCountryCode,
    alternativeMobileNumber:
      get(primary.alternativeMobileNumber) ?? fallback.alternativeMobileNumber,
    gender: get(primary.gender) ?? fallback.gender,
    guardianNameRelationshipId: get(primary.guardianNameRelationshipId)
      ? primary.guardianNameRelationshipId
      : fallback.guardianNameRelationshipId,
    guardianName: get(primary.guardianName) ?? fallback.guardianName,
    country: get(primary.country) ?? fallback.country,
    fullAddress: get(primary.fullAddress) ?? fallback.fullAddress,
    chiefComplaints: get(primary.chiefComplaints) ?? fallback.chiefComplaints,
    admissionType: get(primary.admissionType) ?? fallback.admissionType,
    involuntaryAdmissionType:
      get(primary.involuntaryAdmissionType) ?? fallback.involuntaryAdmissionType,
    illnessType: get(primary.illnessType) ?? fallback.illnessType,
    centerVisitDateTime: get(primary.centerVisitDateTime) ?? fallback.centerVisitDateTime,
    centerId: get(primary.centerId) ? primary.centerId : fallback.centerId,
    firstPersonContactedAtGanaa:
      get(primary.firstPersonContactedAtGanaa) ?? fallback.firstPersonContactedAtGanaa,
    assignedTo: get(primary.assignedTo) ? primary.assignedTo : fallback.assignedTo,
    followUpDate: get(primary.followUpDate) ?? fallback.followUpDate,
    uhid: get(primary.uhid) ?? fallback.uhid,
    identificationMark: get(primary.identificationMark) ?? fallback.identificationMark,
    education: get(primary.education) ?? fallback.education,
    area: get(primary.area) ?? fallback.area,
    familyIncome: get(primary.familyIncome) ?? fallback.familyIncome,
    religion: get(primary.religion) ?? fallback.religion,
    language: get(primary.language) ?? fallback.language,
    isMarried: primary.isMarried != null ? primary.isMarried : fallback.isMarried,
    numberOfChildren: get(primary.numberOfChildren) ?? fallback.numberOfChildren,
    occupation: get(primary.occupation) ?? fallback.occupation,
    personalIncome: get(primary.personalIncome) ?? fallback.personalIncome,
  };
};
