import { ModalState } from "@/components/Header/types";

interface IPermission {
  resource: string;
  actions: string[];
}

interface IRoles {
  _id?: string;
  name?: string;
  permissions?: IPermission[];
}
export interface IUser {
  _id: string;
  firstName: string;
  lastName: string;
  roleId: IRoles;
}

export interface IPatientState {
  totalPages: string | number;
  firstName: string;
  lastName: string;
  UHID: string;
  gender: string;
  patientProfilePic: string;
  assignedTherapist: string;
  patientAdmissionHistoryId: string;
  dateOfAdmission: string;
  patientId: string;
  therapistName: string;
  isTodayNoteExist: boolean;
  illnessType?:string;
}

export interface IPatientFollowup {
  _id: string;
  createdAt: string;
  note: string;
  sessionType: string;
  score: string;
  subSessionType: string;
  file: { fileName: string; filePath: string };
  noteDateTime: string;
  therapistId: IUser;
}

export interface IPatientFollowupState {
  id: string;
  patientId: string;
  patientAdmissionHistoryId: string;
  therapistId: string;
  sessionType: string[];
  score: string;
  subSessionType: string[];
  note: string;
  file: File | null | string;
  fileName: string;
  noteDate: string;
  noteTime: string;
}

export interface IPatientFollowupDropDownsState {
  displayAddForm: boolean;
  displaySessionTypeDropdown: boolean;
  isModalOpen: ModalState;
  displayDropdown: boolean;
  openMenuId: string | null;
}
