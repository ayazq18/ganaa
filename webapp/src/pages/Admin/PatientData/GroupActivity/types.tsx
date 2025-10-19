export interface IActivity {
  name?: string;
  isSelected?: boolean;
  note?: string;
}
export interface IData {
  _id?: string;
  uhid?: string;
  patientId?: string;
  activityDateTime?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  patientPicUrl?: string;
  activity?: IActivity[];
}
export interface ITabData {
  name: string;
  note: string;
}
